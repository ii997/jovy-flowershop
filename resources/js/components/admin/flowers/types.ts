import { Flower } from '../../../types';

export interface FlowerMetrics {
    totalVarieties: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStemsVolume: number;
}

export type FlowerUnitFilter = 'all' | 'stem' | 'stick' | 'kilo';
export type FlowerStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface FlowerRowEdits {
    prices: Record<number, string>;
    unitTypes: Record<number, string>;
    sizes: Record<number, string>;
    bundleQtys: Record<number, string>;
    bundlePrices: Record<number, string>;
    qtys: Record<number, string>;
}

export interface FlowersTabMeta {
    isAdmin: boolean;
    selectedIds: number[];
    toggleSelect: (id: number) => void;
    editPrices: Record<number, string>;
    editUnitTypes: Record<number, string>;
    editSizes: Record<number, string>;
    editBundleQtys: Record<number, string>;
    editBundlePrices: Record<number, string>;
    editQtys: Record<number, string>;
    handleSaveFlower: (flower: Flower) => void;
    handleToggleAvailability: (flower: Flower) => void;
    isSaving: boolean;
    setEditSizes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setEditUnitTypes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setEditPrices: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setEditBundleQtys: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setEditBundlePrices: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    setEditQtys: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}
