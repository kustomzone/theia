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
import * as nativeKeymap from 'native-keymap';
import { AbstractKeyboardLayoutService, KeyboardLayout } from '../../browser/keyboard/keyboard-layout-service';

@injectable()
export class ElectronKeyboardLayoutService extends AbstractKeyboardLayoutService {

    @postConstruct()
    protected initialize(): void {
        this.currentLayout = this.getFromNativeKeymap();
        nativeKeymap.onDidChangeKeyboardLayout(() => {
            this.currentLayout = this.getFromNativeKeymap();
        });
    }

    protected getFromNativeKeymap(): KeyboardLayout {
        return {
            info: nativeKeymap.getCurrentKeyboardLayout(),
            mapping: nativeKeymap.getKeyMap()
        };
    }

}
