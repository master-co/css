import { validate } from '../../src'

export default function expectClassWithoutErrors(syntax: string) {
    expect(validate(syntax).errors).toHaveLength(0)
}