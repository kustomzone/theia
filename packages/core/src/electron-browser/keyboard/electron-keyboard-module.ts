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

import { ContainerModule } from 'inversify';
import { KeyboardLayoutProvider, keyboardPath } from '../../common/keyboard/native-layout';
import { KeyboardLayoutService } from '../../browser/keyboard/keyboard-layout-service';
import { WebSocketConnectionProvider } from '../../browser/messaging/ws-connection-provider';
import { ElectronKeyboardLayoutService } from './keyboard-electron';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronKeyboardLayoutService).toSelf().inSingletonScope();
    bind(KeyboardLayoutService).toService(ElectronKeyboardLayoutService);

    bind(KeyboardLayoutProvider).toDynamicValue(ctx =>
        WebSocketConnectionProvider.createProxy<KeyboardLayoutProvider>(ctx.container, keyboardPath)
    ).inSingletonScope();
});
