import { validate } from '../../src'

export default function expectClassWithErrors(syntax: string) {
    expect(validate(syntax).errors.length).toBeDefined()
}