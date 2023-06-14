import { isClassValid } from '../../src'

export default function expectClassValid(syntax: string) {
    expect(isClassValid(syntax)).toBeTruthy()
}