import {createAction, props} from '@ngrx/store';

export const loadCatalog = createAction('[Catalog] Load', props<{query?: string}>());
export const loadCatalogSuccess = createAction('[Catalog] Load Success', props<{items: any[]}>());
