export type VariableDataValue = string | number | false | (string | number)[]

export interface VariableDataDefinition {
  key: string
  namespace?: string
  value: VariableDataValue
  mode?: string
  inline?: boolean
}

export type VariableDataSection =
  | Record<string, unknown>
  | VariableDataDefinition[]

export interface VariableData {
  variables?: VariableDataSection
  modes?: string[] | Record<string, VariableDataSection>
}
