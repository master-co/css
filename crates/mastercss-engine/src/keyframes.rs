use super::*;
use mastercss_lexer::concat_text;
use mastercss_schema::EngineKeyframeResourceIr;

impl EngineSession {
    pub fn keyframe_definitions(
        &self,
    ) -> Result<&[mastercss_schema::KeyframeDefinition], EngineError> {
        self.ensure_active()?;
        Ok(&self.compiled.keyframes)
    }

    /// Source maps of the keyframes the snapshot emits. Generated class rules
    /// intentionally have no stylesheet source attribution.
    pub fn keyframe_output_mappings(
        &self,
        snapshot: &EngineSnapshotIr,
    ) -> Vec<mastercss_schema::CssOutputMapping> {
        let mut offset =
            snapshot.text.encode_utf16().count() - self.keyframes_text().encode_utf16().count();
        let mut mappings = Vec::new();
        let mut path: &[mastercss_schema::KeyframeContainer] = &[];
        for frame in &snapshot.resources.keyframes {
            let common = shared_containers(path, &frame.containers);
            offset += path.len() - common;
            for container in &frame.containers[common..] {
                offset += container.prelude.encode_utf16().count() + 1;
            }
            let end = offset + frame.text.encode_utf16().count();
            if let Some(source) = self
                .compiled
                .keyframes
                .iter()
                .find(|definition| definition.id == frame.id)
                .and_then(|definition| definition.source.clone())
            {
                mappings.push(mastercss_schema::CssOutputMapping {
                    generated_start: offset as u32,
                    generated_end: Some(end as u32),
                    source,
                });
            }
            offset = end;
            path = &frame.containers;
        }
        mappings
    }

    pub fn class_keyframe_definition(
        &self,
        class_name: &str,
    ) -> Result<Option<mastercss_schema::KeyframeDefinition>, EngineError> {
        self.ensure_active()?;
        let rules = self.generate_class_rules(class_name);
        if rules.iter().any(|rule| rule.ir.retain_all_keyframes) {
            return Ok(None);
        }
        let names = rules
            .iter()
            .flat_map(|rule| rule.ir.keyframe_names.iter())
            .collect::<HashSet<_>>();
        let mut definitions = self
            .compiled
            .keyframes
            .iter()
            .filter(|definition| names.contains(&definition.name));
        let first = definitions.next();
        Ok(first.filter(|_| definitions.next().is_none()).cloned())
    }

    pub fn animation_references(
        &self,
        native_css: &str,
    ) -> Result<AnimationReferences, EngineError> {
        self.ensure_active()?;
        Ok(animation::analyze(
            &stylesheet_declarations(native_css),
            &self.compiled,
        ))
    }

    pub(crate) fn declaration_animation_references(
        &self,
        declarations: &str,
    ) -> AnimationReferences {
        if !declarations.contains('\\')
            && !declarations
                .as_bytes()
                .windows(9)
                .any(|word| word.eq_ignore_ascii_case(b"animation"))
        {
            return AnimationReferences::default();
        }
        animation::analyze(
            &stylesheet_declarations(&concat_text!("a{", declarations, "}")),
            &self.compiled,
        )
    }

    pub(crate) fn register_keyframes(&mut self, names: &[String], all: bool) {
        if !all && names.is_empty() {
            return;
        }
        let definitions = self
            .compiled
            .keyframes
            .iter()
            .filter(|definition| all || names.contains(&definition.name))
            .cloned()
            .collect::<Vec<_>>();
        for definition in definitions {
            let count = self.keyframe_counts.entry(definition.id).or_default();
            *count = count.saturating_add(1);
            if *count == 1 {
                self.register_rule_variables(&definition.dependencies);
            }
        }
    }

    pub(crate) fn unregister_keyframes(&mut self, names: &[String], all: bool) {
        if !all && names.is_empty() {
            return;
        }
        let definitions = self
            .compiled
            .keyframes
            .iter()
            .filter(|definition| all || names.contains(&definition.name))
            .cloned()
            .collect::<Vec<_>>();
        for definition in definitions {
            let floor = self
                .keyframe_floors
                .get(&definition.id)
                .copied()
                .unwrap_or_default();
            let Some(count) = self.keyframe_counts.get_mut(&definition.id) else {
                continue;
            };
            if *count > floor {
                *count -= 1;
                if *count == 0 {
                    self.keyframe_counts.remove(&definition.id);
                    self.unregister_rule_variables(&definition.dependencies);
                }
            }
        }
    }

    /// The keyframes this session emits: referenced, on demand and not emitted by the
    /// host. Native definitions are counted for the tokens their frames read, but
    /// their stylesheet delivers them.
    pub(crate) fn keyframe_snapshot(&self) -> Vec<EngineKeyframeResourceIr> {
        self.compiled
            .keyframes
            .iter()
            .filter(|definition| !definition.native)
            .filter_map(|definition| {
                let count = self
                    .keyframe_counts
                    .get(&definition.id)
                    .copied()
                    .unwrap_or_default();
                (count > 0
                    && self
                        .emitted_globals
                        .keyframes
                        .get(&definition.id)
                        .copied()
                        .unwrap_or_default()
                        == 0)
                    .then(|| EngineKeyframeResourceIr {
                        id: definition.id.clone(),
                        name: definition.name.clone(),
                        containers: definition.containers.clone(),
                        text: definition.text.clone(),
                        ref_count: count,
                        dependencies: definition.dependencies.clone(),
                    })
            })
            .collect()
    }

    pub(crate) fn sync_keyframes(&mut self) -> Vec<RuleMutationIr> {
        let next = self
            .keyframe_snapshot()
            .into_iter()
            .map(|definition| (definition.id, definition.text, definition.containers))
            .collect::<Vec<_>>();
        let mut mutations = Vec::new();
        for index in (0..self.keyframe_texts.len()).rev() {
            if !next.contains(&self.keyframe_texts[index]) {
                let (key, _, _) = self.keyframe_texts.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key,
                });
            }
        }
        for (index, placement) in next.iter().enumerate() {
            let (key, text, _) = placement;
            if self.keyframe_texts.get(index) == Some(placement) {
                continue;
            }
            if let Some(previous) = self
                .keyframe_texts
                .iter()
                .position(|(name, _, _)| name == key)
            {
                self.keyframe_texts.remove(previous);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: previous as u32,
                    key: key.clone(),
                });
            }
            self.keyframe_texts.insert(index, placement.clone());
            mutations.push(RuleMutationIr::Insert {
                target: RuleTarget::Keyframes,
                index: index as u32,
                key: key.clone(),
                text: text.clone(),
                rule: None,
            });
        }
        mutations
    }

    /// HMR supplies the complete external resource snapshot; it must not add
    /// another permanent reference each time a stylesheet changes.
    pub fn replace_emitted_globals(
        &mut self,
        globals: EmittedGlobals,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        if globals == self.emitted_globals {
            return Ok(EngineTransitionIr::empty());
        }
        self.rebuild(globals)
    }

    /// The emitted keyframes, each wrapped in the containers it was declared in.
    pub(crate) fn keyframes_text(&self) -> String {
        let mut text = String::new();
        let mut path = Vec::new();
        for frame in self.keyframe_snapshot() {
            let common = shared_containers(&path, &frame.containers);
            text.extend(std::iter::repeat_n('}', path.len() - common));
            for container in &frame.containers[common..] {
                text.push_str(&container.prelude);
                text.push('{');
            }
            text.push_str(&frame.text);
            path = frame.containers;
        }
        text.extend(std::iter::repeat_n('}', path.len()));
        text
    }
}

/// The length of the container path two consecutive frames share.
fn shared_containers(
    left: &[mastercss_schema::KeyframeContainer],
    right: &[mastercss_schema::KeyframeContainer],
) -> usize {
    left.iter()
        .zip(right)
        .take_while(|(left, right)| left.id == right.id)
        .count()
}
