import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, shareReplay} from 'rxjs';
import {environment} from '../../../environments/environment';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  price: number;
  discountPercent?: number;
  taxPercent?: number;
  unit: string;
  imageUrl?: string;
  description?: string;
  availableQty?: number;
}

export interface CatalogCategoryOption {
  id: number;
  name: string;
}

export interface CatalogSubcategoryOption {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface ProductQueryParams {
  categoryIds?: number[];
  subcategoryIds?: number[];
  priceMin?: number | null;
  priceMax?: number | null;
  inStockOnly?: boolean;
  sort?: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';
  page?: number;
  size?: number;
  q?: string;
}

export interface ProductPage {
  content: Product[];
  page: number;
  size: number;
  totalElements: number;
  serverFiltered: boolean;
}

export interface BulkUploadRowError {
  rowNumber: number;
  message: string;
}

export interface BulkUploadResult {
  totalRows: number;
  successRows: number;
  failedRows: number;
  updatedSkus: string[];
  errors: BulkUploadRowError[];
}

@Injectable({providedIn: 'root'})
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly productCatalog$ = this.listProducts().pipe(
    map(products => {
      const categoriesByName = new Map<string, CatalogCategoryOption>();
      const subcategoriesByKey = new Map<string, CatalogSubcategoryOption>();

      for (const p of products) {
        const categoryName = (p.category || 'Unknown').trim();
        const subcategoryName = (p.subcategory || 'General').trim();
        const categoryId = stableNumericId(categoryName);
        const subcategoryKey = `${categoryName}::${subcategoryName}`;

        if (!categoriesByName.has(categoryName)) {
          categoriesByName.set(categoryName, {id: categoryId, name: categoryName});
        }
        if (!subcategoriesByKey.has(subcategoryKey)) {
          subcategoriesByKey.set(subcategoryKey, {
            id: stableNumericId(subcategoryKey),
            name: subcategoryName,
            categoryId,
            categoryName
          });
        }
      }

      return {
        products,
        categories: [...categoriesByName.values()].sort((a, b) => a.name.localeCompare(b.name)),
        subcategories: [...subcategoriesByKey.values()].sort((a, b) => a.name.localeCompare(b.name))
      };
    }),
    shareReplay(1)
  );

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiBaseUrl}/catalog/catalog/products`);
  }

  getCatalogMetadata(): Observable<{products: Product[]; categories: CatalogCategoryOption[]; subcategories: CatalogSubcategoryOption[]}> {
    return this.productCatalog$;
  }

  getProducts(params: ProductQueryParams): Observable<ProductPage> {
    // TODO: backend should support these params server-side:
    // categoryIds, subcategoryIds, priceMin, priceMax, inStockOnly, sort, page, size.
    // Current backend supports only /products?q=..., so UI applies fallback filtering/paging client-side.
    let httpParams = new HttpParams();
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.categoryIds?.length) {
      params.categoryIds.forEach(id => httpParams = httpParams.append('categoryIds', String(id)));
    }
    if (params.subcategoryIds?.length) {
      params.subcategoryIds.forEach(id => httpParams = httpParams.append('subcategoryIds', String(id)));
    }
    if (params.priceMin !== undefined && params.priceMin !== null) {
      httpParams = httpParams.set('priceMin', String(params.priceMin));
    }
    if (params.priceMax !== undefined && params.priceMax !== null) {
      httpParams = httpParams.set('priceMax', String(params.priceMax));
    }
    if (params.inStockOnly) {
      httpParams = httpParams.set('inStockOnly', 'true');
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', String(params.size));
    }

    return this.http.get<Product[]>(`${environment.apiBaseUrl}/catalog/catalog/products`, {params: httpParams}).pipe(
      map(content => ({
        content,
        page: params.page ?? 0,
        size: params.size ?? (content.length || 12),
        totalElements: content.length,
        serverFiltered: false
      }))
    );
  }

  listAdminProducts(query?: string): Observable<Product[]> {
    const suffix = query && query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return this.http.get<Product[]>(`${environment.apiBaseUrl}/catalog/catalog/admin/products${suffix}`);
  }

  updateProduct(id: number, request: {
    name: string;
    price: number;
    taxPercent: number;
    discountPercent?: number;
    unit: string;
    description?: string;
    imageUrl?: string;
  }): Observable<Product> {
    return this.http.patch<Product>(`${environment.apiBaseUrl}/catalog/catalog/admin/products/${id}`, request);
  }

  uploadProductImage(id: number, file: File): Observable<Product> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Product>(`${environment.apiBaseUrl}/catalog/catalog/admin/products/${id}/image`, form);
  }

  uploadExcel(file: File): Observable<BulkUploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<BulkUploadResult>(`${environment.apiBaseUrl}/catalog/catalog/admin/upload`, form);
  }
}

function stableNumericId(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}
