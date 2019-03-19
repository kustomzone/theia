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

import { IKeyboardMapping, IKeyboardLayoutInfo } from 'native-keymap';
import { Emitter, Event } from '../../common/event';
import { KeyCode } from './keys';

export const IKeyboardLayoutService = Symbol('IKeyboardLayoutService');

export interface IKeyboardLayoutService {

    readonly onKeyboardLayoutChanged: Event<KeyboardLayout>;

    resolveKeyCode(code: KeyCode): KeyCode;

}

export abstract class AbstractKeyboardLayoutService implements IKeyboardLayoutService {

    private _currentLayout: KeyboardLayout;

    protected get currentLayout(): KeyboardLayout {
        return this._currentLayout;
    }

    protected set currentLayout(newLayout: KeyboardLayout) {
        const previousLayout = this._currentLayout;
        this._currentLayout = newLayout;
        if (newLayout !== previousLayout) {
            this.keyboardLayoutChanged.fire(newLayout);
        }
    }

    protected keyboardLayoutChanged = new Emitter<KeyboardLayout>();

    get onKeyboardLayoutChanged() {
        return this.keyboardLayoutChanged.event;
    }

    resolveKeyCode(code: KeyCode): KeyCode {
        return code;
    }

}

export interface KeyboardLayout {
    info: IKeyboardLayoutInfo;
    mapping: IKeyboardMapping;
}
