import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {loadCatalog, loadCatalogSuccess} from './catalog.actions';
import {map, switchMap} from 'rxjs/operators';

@Injectable()
export class CatalogEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);

  load$ = createEffect(() => this.actions$.pipe(
    ofType(loadCatalog),
    switchMap(({query}) => this.http.get<any[]>(`${environment.apiBaseUrl}/catalog/catalog/products`, {params: query ? {q: query} : {}})
      .pipe(map(items => loadCatalogSuccess({items}))))
  ));
}
