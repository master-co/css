use super::*;
use mastercss_schema::EngineKeyframeResourceIr;

impl EngineSession {
    pub fn keyframe_definitions(
        &self,
    ) -> Result<&[mastercss_schema::KeyframeDefinition], EngineError> {
        self.ensure_active()?;
        Ok(&self.compiled.keyframes)
    }

    /// Authored resource anchors for server/compiler output maps. Generated class rules
    /// intentionally have no stylesheet source attribution.
    pub fn keyframe_output_mappings(
        &self,
        snapshot: &EngineSnapshotIr,
    ) -> Vec<mastercss_schema::CssOutputMapping> {
        let mut offset = snapshot.text.encode_utf16().count()
            - self.standalone_keyframe_text().encode_utf16().count();
        let mut mappings = Vec::new();
        let mut path: Vec<mastercss_schema::KeyframeContainer> = Vec::new();
        for frame in snapshot
            .resources
            .keyframes
            .iter()
            .filter(|frame| !frame.anchored)
        {
            let common = path
                .iter()
                .zip(&frame.containers)
                .take_while(|(a, b)| a.id == b.id)
                .count();
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
            path = frame.containers.clone();
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
            &stylesheet_declarations(&format!("a{{{declarations}}}")),
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
            .filter(|definition| {
                (all || names.contains(&definition.name))
                    && !self
                        .emitted_globals
                        .suppressed_keyframes
                        .contains(&definition.id)
            })
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
            .filter(|definition| {
                (all || names.contains(&definition.name))
                    && !self
                        .emitted_globals
                        .suppressed_keyframes
                        .contains(&definition.id)
            })
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

    pub(crate) fn keyframe_snapshot(&self) -> Vec<EngineKeyframeResourceIr> {
        self.compiled
            .keyframes
            .iter()
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
                        anchored: self.keyframe_has_slot(&definition.id),
                        text: self.resolved_keyframe_text(definition),
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
            .map(|definition| {
                (
                    definition.id,
                    definition.text,
                    definition.anchored,
                    definition.containers,
                )
            })
            .collect::<Vec<_>>();
        let mut mutations = Vec::new();
        for index in (0..self.keyframe_texts.len()).rev() {
            if !next.contains(&self.keyframe_texts[index]) {
                let (key, _, _, _) = self.keyframe_texts.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key,
                });
            }
        }
        for (index, placement) in next.iter().enumerate() {
            let (key, text, _, _) = placement;
            if self.keyframe_texts.get(index) == Some(placement) {
                continue;
            }
            if let Some(previous) = self
                .keyframe_texts
                .iter()
                .position(|(name, _, _, _)| name == key)
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
        json: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let globals = EmittedGlobals::parse(json)
            .map_err(|error| EngineError::InvalidEmittedGlobals(error.to_string()))?;
        if globals == self.emitted_globals {
            return Ok(EngineTransitionIr::empty());
        }
        self.rebuild(self.manifest.clone(), self.compiled.clone(), globals)
    }
}
