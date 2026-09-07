use super::*;

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RulePriorityIr {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub features: Vec<(String, f64, f64)>,
    pub selector: i32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedRuleNodeIr {
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedRuleIr {
    pub class_name: String,
    pub key: String,
    pub layer: UtilityLayerName,
    #[serde(rename = "type")]
    pub utility_type: i32,
    pub sort_tier: i32,
    pub priority: RulePriorityIr,
    pub text: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub nodes: Vec<GeneratedRuleNodeIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selector_text: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub variable_names: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub animation_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HydrationManifest {
    pub version: u32,
    pub rules: Vec<GeneratedRuleIr>,
    pub resource_order: Vec<String>,
}

impl HydrationManifest {
    pub fn new(rules: Vec<GeneratedRuleIr>, resource_order: Vec<String>) -> Self {
        Self {
            version: HYDRATION_MANIFEST_VERSION,
            rules,
            resource_order,
        }
    }

    pub fn from_snapshot(snapshot: &EngineSnapshotIr) -> Self {
        let resource_order = snapshot
            .resources
            .variables
            .iter()
            .map(|resource| resource.name.clone())
            .chain(
                snapshot
                    .resources
                    .animations
                    .iter()
                    .map(|resource| resource.name.clone()),
            )
            .collect();
        Self::new(snapshot.rules.clone(), resource_order)
    }

    pub fn to_script_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self).map(|json| json.replace('<', "\\u003c"))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "lowercase", rename_all_fields = "camelCase")]
pub enum RuleMutationIr {
    Insert {
        target: RuleTarget,
        index: u32,
        key: String,
        text: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        rule: Option<Box<GeneratedRuleIr>>,
    },
    Delete {
        target: RuleTarget,
        index: u32,
        key: String,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineTransitionIr {
    pub version: u32,
    pub mutations: Vec<RuleMutationIr>,
}

impl EngineTransitionIr {
    pub fn new(mutations: Vec<RuleMutationIr>) -> Self {
        Self {
            version: ENGINE_TRANSITION_VERSION,
            mutations,
        }
    }

    pub fn empty() -> Self {
        Self::new(Vec::new())
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineSnapshotIr {
    pub version: u32,
    pub rules: Vec<GeneratedRuleIr>,
    pub resources: EngineResourcesIr,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineVariableResourceIr {
    pub name: String,
    pub ref_count: u32,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
    #[serde(rename = "static")]
    pub static_resource: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineAnimationResourceIr {
    pub name: String,
    pub index: u32,
    pub ref_count: u32,
    pub text: String,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineResourcesIr {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_text: Option<String>,
    pub variables: Vec<EngineVariableResourceIr>,
    pub animations: Vec<EngineAnimationResourceIr>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineInspectionIr {
    pub version: u32,
    pub class_name: String,
    pub valid: bool,
    pub rules: Vec<GeneratedRuleIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeDeclarationCandidateIr {
    pub class_name: String,
    pub property: String,
    pub value: String,
}
