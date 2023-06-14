import { reportErrors } from '../../src'

export default function expectClassWithoutErrors(syntax: string) {
    expect(reportErrors(syntax)).toHaveLength(0)
}