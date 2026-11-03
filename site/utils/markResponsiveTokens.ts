import { Style } from "@master/css";
import { Dispatch, SetStateAction } from "react";

export function markResponsiveTokens(state: [string, Dispatch<SetStateAction<string>>], originHtml: string, width: number, propertyPrefixes: string[]) {
    const keys = Object.keys(Style.breakpoints);
    const values = Object.values(Style.breakpoints);

    for (const eachPropertyPrefix of propertyPrefixes) {
        let matched = false;
        let first = undefined;
    
        for (let i = keys.length - 1; i >= 0; i--) {
            const key = keys[i];
            const value = values[i];
            const regexp = new RegExp(eachPropertyPrefix + '\\*\\*@' + key + '\\*\\*', 'g');
            if (regexp.test(originHtml)) {
                let currentMatched = false;
                if (!matched) {
                    matched = currentMatched = value <= width && (i === 0 || width > values[i - 1]) || first === undefined && width > value;
                    first = true;
                }
    
                const symbol = matched
                    ? currentMatched
                        ? ''
                        : '--'
                    : '__';
                originHtml = originHtml.replace(regexp, 
                    `${symbol}$&${symbol}`);
            }
        }
    
        if (matched) {
            originHtml = originHtml.replace(new RegExp(eachPropertyPrefix + '(?!@)'), '--$&--');
        }
    }

    state[1](originHtml);
}