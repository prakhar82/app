import {createReducer, on} from '@ngrx/store';
import {loadCatalogSuccess} from './catalog.actions';

export const catalogReducer = createReducer({items: [] as any[]}, on(loadCatalogSuccess, (_, {items}) => ({items})));
