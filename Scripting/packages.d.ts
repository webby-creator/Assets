declare module "fetch/index" {
    export default function (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    export function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T>;
}
declare module "window/index" {
    export default function (): void;
}
declare module "data/dataBuilder" {
    type Value = string | number | boolean | null;
    type FilterType = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'cont' | 'dnc' | 'between';
    type Filter = {
        name: string;
        cond: FilterType;
        value: Value;
    };
    export class DataBuilder {
        collectionId: string;
        offset: number;
        limit: number;
        descending: string;
        filters: Filter[];
        constructor(collectionId: string);
        filter(name: string, cond: FilterType, value: Value): this;
        find(): Promise<ItemResponse>;
    }
    interface ItemResponse {
        items: object[];
        offset: number;
        limit: number;
        total: number;
    }
}
declare module "data/index" {
    import { DataBuilder } from "data/dataBuilder";
    export function get(collId: string, itemId: string): Promise<object>;
    export function query(collId: string): DataBuilder;
}
declare module "widget/index" {
    export function getProps(): Promise<object>;
    export function setProps(value: object): Promise<unknown>;
    export function getDesignPreset(): Promise<string>;
    export function setDesignPreset(preset: string): Promise<void>;
    export function getNestedWidget(selector: string): Promise<object>;
    const _default: {
        getProps: typeof getProps;
        setProps: typeof setProps;
        getDesignPreset: typeof getDesignPreset;
        getNestedWidget: typeof getNestedWidget;
        setDesignPreset: typeof setDesignPreset;
    };
    export default _default;
}
