import { reportErrors } from '../../src'

export default function expectClassWithErrors(syntax: string) {
    expect(reportErrors(syntax).length).toBeDefined()
}