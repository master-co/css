import { isClassValid } from '../../src'

export default function expectClassInvalid(syntax: string) {
    expect(isClassValid(syntax)).toBeFalsy()
}