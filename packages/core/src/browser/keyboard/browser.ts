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

import { injectable, postConstruct } from 'inversify';
import { isOSX } from '../../common/os';
import { AbstractKeyboardLayoutService, KeyboardLayout } from './keyboard-layout-service';

import macUS = require('../../../src/common/keyboard-layouts/mac-en-US.json');
import macFrench = require('../../../src/common/keyboard-layouts/mac-fr-French.json');
import macGerman = require('../../../src/common/keyboard-layouts/mac-de-German.json');

@injectable()
export class BrowserKeyboardLayoutService extends AbstractKeyboardLayoutService {

    private _currentLayout: KeyboardLayout;

    protected get currentLayout(): KeyboardLayout {
        return this._currentLayout;
    }

    protected set currentLayout(newLayout: KeyboardLayout) {
        this._currentLayout = newLayout;
        this.keyboardLayoutChanged.fire(newLayout);
    }

    @postConstruct()
    protected initialize(): void {
        if (isOSX) {
            this._currentLayout = macUS;
        }

        const keyboard = (navigator as NavigatorExtension).keyboard;
        if (keyboard && keyboard.getLayoutMap) {
            const update = () => {
                keyboard.getLayoutMap().then(layoutMap => this.getFromLayoutMap(layoutMap));
            };
            update();
            keyboard.addEventListener('layoutchange', update);
        } else if (navigator.language) {
            this.getFromLanguage(navigator.language);
        }
    }

    /**
     * @param layoutMap a keyboard layout map according to https://wicg.github.io/keyboard-map/
     */
    protected getFromLayoutMap(layoutMap: KeyboardLayoutMap): void {


    }

    /**
     * @param language an IETF BCP 47 language tag
     */
    protected getFromLanguage(language: string): void {
        if (language.startsWith('de')) {
            this.currentLayout = macGerman;
        } else if (language.startsWith('en')) {
            this.currentLayout = macUS;
        } else if (language.startsWith('fr')) {
            this.currentLayout = macFrench;
        }
    }

}

interface NavigatorExtension extends Navigator {
    keyboard: Keyboard;
}

interface Keyboard {
    getLayoutMap(): Promise<KeyboardLayoutMap>;
    addEventListener(type: 'layoutchange', listener: EventListenerOrEventListenerObject): void;
}

type KeyboardLayoutMap = Map<string, string>;
