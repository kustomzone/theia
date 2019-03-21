/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { isOSX } from '../../common/os';
import { NativeKeyboardLayout, KeyboardLayoutProvider } from '../../common/keyboard/layout-provider';
import { Emitter } from '../../common/event';
import { KeyCode, KeyModifier, Key } from './keys';

export interface KeyboardLayout {
    readonly character2KeyCode: KeyCode[];
}

@injectable()
export class KeyboardLayoutService {

    @inject(KeyboardLayoutProvider)
    protected readonly layoutProvider: KeyboardLayoutProvider;

    private _nativeLayout?: NativeKeyboardLayout;
    private _currentLayout?: KeyboardLayout;

    protected set nativeLayout(newLayout: NativeKeyboardLayout) {
        const previousLayout = this._nativeLayout;
        this._nativeLayout = newLayout;
        if (newLayout !== previousLayout) {
            const transformed = this.transformNativeLayout(newLayout);
            this._currentLayout = transformed;
            this.keyboardLayoutChanged.fire(transformed);
        }
    }

    protected keyboardLayoutChanged = new Emitter<KeyboardLayout>();

    get onKeyboardLayoutChanged() {
        return this.keyboardLayoutChanged.event;
    }

    async initialize(): Promise<void> {
        const layoutService = this;
        this.layoutProvider.setClient({
            onNativeLayoutChanged(newLayout: NativeKeyboardLayout): void {
                layoutService.nativeLayout = newLayout;
            }
        });
        const newLayout = await this.layoutProvider.getNativeLayout();
        this.nativeLayout = newLayout;
    }

    resolveKeyCode(inCode: KeyCode): KeyCode {
        const layout = this._currentLayout;
        if (layout && inCode.key) {
            for (let shift = 0; shift <= 1; shift++) {
                const index = this.getCharacterIndex(inCode.key, !!shift);
                const mappedCode = layout.character2KeyCode[index];
                if (mappedCode) {
                    const transformed = this.transformKeyCode(inCode, mappedCode, !!shift);
                    if (transformed) {
                        return transformed;
                    }
                }
            }
        }
        return inCode;
    }

    getKeyboardCharacter(key: Key): string {
        const layout = this._nativeLayout;
        if (layout) {
            const keyMapping = layout.mapping[key.code];
            if (keyMapping && keyMapping.value) {
                return keyMapping.value;
            }
        }
        const easyKey = Key.getEasyKey(key);
        return easyKey.easyString;
    }

    protected transformKeyCode(inCode: KeyCode, mappedCode: KeyCode, keyNeedsShift: boolean): KeyCode | undefined {
        if (!inCode.shift && keyNeedsShift) {
            return undefined;
        }
        if (mappedCode.alt && (inCode.alt || inCode.ctrl || inCode.shift && !keyNeedsShift)) {
            return undefined;
        }
        const ctrlMod = inCode.ctrl || mappedCode.alt;
        const shiftMod = inCode.shift && !keyNeedsShift || mappedCode.shift;
        const altMod = inCode.alt || mappedCode.alt;

        const keystroke = [mappedCode.key!.code];
        if (isOSX) {
            if (inCode.meta) {
                keystroke.push(KeyModifier.CtrlCmd);
            }
            if (shiftMod) {
                keystroke.push(KeyModifier.Shift);
            }
            if (altMod) {
                keystroke.push(KeyModifier.Alt);
            }
            if (ctrlMod) {
                keystroke.push(KeyModifier.MacCtrl);
            }
        } else {
            if (ctrlMod) {
                keystroke.push(KeyModifier.CtrlCmd);
            }
            if (shiftMod) {
                keystroke.push(KeyModifier.Shift);
            }
            if (altMod) {
                keystroke.push(KeyModifier.Alt);
            }
        }
        return new KeyCode(keystroke);
    }

    protected transformNativeLayout(nativeLayout: NativeKeyboardLayout): KeyboardLayout {
        const character2KeyCode: KeyCode[] = Array(512);
        const mapping = nativeLayout.mapping;
        for (const code in mapping) {
            if (mapping.hasOwnProperty(code)) {
                const keyMapping = mapping[code];
                if (keyMapping.value) {
                    this.addKeyMapping(character2KeyCode, code, keyMapping.value, false, false);
                }
                if (keyMapping.withShift) {
                    this.addKeyMapping(character2KeyCode, code, keyMapping.withShift, true, false);
                }
                if (keyMapping.withAltGr) {
                    this.addKeyMapping(character2KeyCode, code, keyMapping.withAltGr, false, true);
                }
                if (keyMapping.withShiftAltGr) {
                    this.addKeyMapping(character2KeyCode, code, keyMapping.withShiftAltGr, true, true);
                }
            }
        }
        return { character2KeyCode };
    }

    private addKeyMapping(character2KeyCode: KeyCode[], code: string, value: string, shift: boolean, alt: boolean): void {
        const key = VALUE_TO_KEY[value];
        if (key) {
            const index = this.getCharacterIndex(key.key, key.shift);
            if (character2KeyCode[index] === undefined) {
                const keystroke = [code];
                if (shift) {
                    keystroke.push(KeyModifier.Shift);
                }
                if (alt) {
                    keystroke.push(KeyModifier.Alt);
                }
                character2KeyCode[index] = new KeyCode(keystroke, value);
            }
        }
    }

    private getCharacterIndex(key: Key, shift?: boolean): number {
        if (shift) {
            return 256 + key.keyCode;
        } else {
            return key.keyCode;
        }
    }

}

/**
 * Mapping of character values to the corresponding keys on a standard US keyboard layout.
 */
const VALUE_TO_KEY: { [value: string]: { key: Key, shift?: boolean } } = {};

(() => {
    VALUE_TO_KEY['`'] = { key: Key.BACKQUOTE };
    VALUE_TO_KEY['~'] = { key: Key.BACKQUOTE, shift: true };
    VALUE_TO_KEY['1'] = { key: Key.DIGIT1 };
    VALUE_TO_KEY['!'] = { key: Key.DIGIT1, shift: true };
    VALUE_TO_KEY['2'] = { key: Key.DIGIT2 };
    VALUE_TO_KEY['@'] = { key: Key.DIGIT2, shift: true };
    VALUE_TO_KEY['3'] = { key: Key.DIGIT3 };
    VALUE_TO_KEY['#'] = { key: Key.DIGIT3, shift: true };
    VALUE_TO_KEY['4'] = { key: Key.DIGIT4 };
    VALUE_TO_KEY['$'] = { key: Key.DIGIT4, shift: true };
    VALUE_TO_KEY['5'] = { key: Key.DIGIT5 };
    VALUE_TO_KEY['%'] = { key: Key.DIGIT5, shift: true };
    VALUE_TO_KEY['6'] = { key: Key.DIGIT6 };
    VALUE_TO_KEY['^'] = { key: Key.DIGIT6, shift: true };
    VALUE_TO_KEY['7'] = { key: Key.DIGIT7 };
    VALUE_TO_KEY['&'] = { key: Key.DIGIT7, shift: true };
    VALUE_TO_KEY['8'] = { key: Key.DIGIT8 };
    VALUE_TO_KEY['*'] = { key: Key.DIGIT8, shift: true };
    VALUE_TO_KEY['9'] = { key: Key.DIGIT9 };
    VALUE_TO_KEY['('] = { key: Key.DIGIT9, shift: true };
    VALUE_TO_KEY['0'] = { key: Key.DIGIT0 };
    VALUE_TO_KEY[')'] = { key: Key.DIGIT0, shift: true };
    VALUE_TO_KEY['-'] = { key: Key.MINUS };
    VALUE_TO_KEY['_'] = { key: Key.MINUS, shift: true };
    VALUE_TO_KEY['='] = { key: Key.EQUAL };
    VALUE_TO_KEY['+'] = { key: Key.EQUAL, shift: true };

    VALUE_TO_KEY['a'] = { key: Key.KEY_A };
    VALUE_TO_KEY['A'] = { key: Key.KEY_A, shift: true };
    VALUE_TO_KEY['b'] = { key: Key.KEY_B };
    VALUE_TO_KEY['B'] = { key: Key.KEY_B, shift: true };
    VALUE_TO_KEY['c'] = { key: Key.KEY_C };
    VALUE_TO_KEY['C'] = { key: Key.KEY_C, shift: true };
    VALUE_TO_KEY['d'] = { key: Key.KEY_D };
    VALUE_TO_KEY['D'] = { key: Key.KEY_D, shift: true };
    VALUE_TO_KEY['e'] = { key: Key.KEY_E };
    VALUE_TO_KEY['E'] = { key: Key.KEY_E, shift: true };
    VALUE_TO_KEY['f'] = { key: Key.KEY_F };
    VALUE_TO_KEY['F'] = { key: Key.KEY_F, shift: true };
    VALUE_TO_KEY['g'] = { key: Key.KEY_G };
    VALUE_TO_KEY['G'] = { key: Key.KEY_G, shift: true };
    VALUE_TO_KEY['h'] = { key: Key.KEY_H };
    VALUE_TO_KEY['H'] = { key: Key.KEY_H, shift: true };
    VALUE_TO_KEY['i'] = { key: Key.KEY_I };
    VALUE_TO_KEY['I'] = { key: Key.KEY_I, shift: true };
    VALUE_TO_KEY['j'] = { key: Key.KEY_J };
    VALUE_TO_KEY['J'] = { key: Key.KEY_J, shift: true };
    VALUE_TO_KEY['k'] = { key: Key.KEY_K };
    VALUE_TO_KEY['K'] = { key: Key.KEY_K, shift: true };
    VALUE_TO_KEY['l'] = { key: Key.KEY_L };
    VALUE_TO_KEY['L'] = { key: Key.KEY_L, shift: true };
    VALUE_TO_KEY['m'] = { key: Key.KEY_M };
    VALUE_TO_KEY['M'] = { key: Key.KEY_M, shift: true };
    VALUE_TO_KEY['n'] = { key: Key.KEY_N };
    VALUE_TO_KEY['N'] = { key: Key.KEY_N, shift: true };
    VALUE_TO_KEY['o'] = { key: Key.KEY_O };
    VALUE_TO_KEY['O'] = { key: Key.KEY_O, shift: true };
    VALUE_TO_KEY['p'] = { key: Key.KEY_P };
    VALUE_TO_KEY['P'] = { key: Key.KEY_P, shift: true };
    VALUE_TO_KEY['q'] = { key: Key.KEY_Q };
    VALUE_TO_KEY['Q'] = { key: Key.KEY_Q, shift: true };
    VALUE_TO_KEY['r'] = { key: Key.KEY_R };
    VALUE_TO_KEY['R'] = { key: Key.KEY_R, shift: true };
    VALUE_TO_KEY['s'] = { key: Key.KEY_S };
    VALUE_TO_KEY['S'] = { key: Key.KEY_S, shift: true };
    VALUE_TO_KEY['t'] = { key: Key.KEY_T };
    VALUE_TO_KEY['T'] = { key: Key.KEY_T, shift: true };
    VALUE_TO_KEY['u'] = { key: Key.KEY_U };
    VALUE_TO_KEY['U'] = { key: Key.KEY_U, shift: true };
    VALUE_TO_KEY['v'] = { key: Key.KEY_V };
    VALUE_TO_KEY['V'] = { key: Key.KEY_V, shift: true };
    VALUE_TO_KEY['w'] = { key: Key.KEY_W };
    VALUE_TO_KEY['W'] = { key: Key.KEY_W, shift: true };
    VALUE_TO_KEY['x'] = { key: Key.KEY_X };
    VALUE_TO_KEY['X'] = { key: Key.KEY_X, shift: true };
    VALUE_TO_KEY['y'] = { key: Key.KEY_Y };
    VALUE_TO_KEY['Y'] = { key: Key.KEY_Y, shift: true };
    VALUE_TO_KEY['z'] = { key: Key.KEY_Z };
    VALUE_TO_KEY['Z'] = { key: Key.KEY_Z, shift: true };

    VALUE_TO_KEY['['] = { key: Key.BRACKET_LEFT };
    VALUE_TO_KEY['{'] = { key: Key.BRACKET_LEFT, shift: true };
    VALUE_TO_KEY[']'] = { key: Key.BRACKET_RIGHT };
    VALUE_TO_KEY['}'] = { key: Key.BRACKET_RIGHT, shift: true };
    VALUE_TO_KEY[';'] = { key: Key.SEMICOLON };
    VALUE_TO_KEY[':'] = { key: Key.SEMICOLON, shift: true };
    VALUE_TO_KEY["'"] = { key: Key.QUOTE };
    VALUE_TO_KEY['"'] = { key: Key.QUOTE, shift: true };
    VALUE_TO_KEY[','] = { key: Key.COMMA };
    VALUE_TO_KEY['<'] = { key: Key.COMMA, shift: true };
    VALUE_TO_KEY['.'] = { key: Key.PERIOD };
    VALUE_TO_KEY['>'] = { key: Key.PERIOD, shift: true };
    VALUE_TO_KEY['/'] = { key: Key.SLASH };
    VALUE_TO_KEY['?'] = { key: Key.SLASH, shift: true };
    VALUE_TO_KEY['\\'] = { key: Key.BACKSLASH };
    VALUE_TO_KEY['|'] = { key: Key.BACKSLASH, shift: true };

    VALUE_TO_KEY['\t'] = { key: Key.TAB };
    VALUE_TO_KEY['\n'] = { key: Key.ENTER };
    VALUE_TO_KEY[' '] = { key: Key.SPACE };
})();
