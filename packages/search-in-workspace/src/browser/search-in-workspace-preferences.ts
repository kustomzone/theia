/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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

import { PreferenceSchema, PreferenceProxy, PreferenceService, createPreferenceProxy, PreferenceContribution } from '@theia/core/lib/browser/preferences';
import { interfaces } from 'inversify';

export const searchInWorkspacePreferencesSchema: PreferenceSchema = {
    type: 'object',
    properties: {
        'search-in-workspace.lineNumbers': {
            description: 'Enable line numbers when displaying results.',
            default: false,
            type: 'boolean',
        }
    }
};

export class SearchInWorkspaceConfiguration {
    'search-in-workspace.lineNumbers': boolean;
}

export const SearchInWorkspacePreferences = Symbol('SearchInWorkspacePreferences');
export type SearchInWorkspacePreferences = PreferenceProxy<SearchInWorkspaceConfiguration>;

export function createSearchInWorkspacePreferences(preferences: PreferenceService): SearchInWorkspacePreferences {
    return createPreferenceProxy(preferences, searchInWorkspacePreferencesSchema);
}

export function bindSearchInWorkspacePreferences(bind: interfaces.Bind): void {
    bind(SearchInWorkspacePreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createSearchInWorkspacePreferences(preferences);
    }).inSingletonScope();
    bind(PreferenceContribution).toConstantValue({ schema: searchInWorkspacePreferencesSchema });
}
