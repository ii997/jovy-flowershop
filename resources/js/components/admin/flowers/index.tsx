import { useState } from 'react';
import { Flower } from '../../../types';
import { FlowersTabSkeleton } from '../../ui/Skeleton';
import { useFlowerMetrics } from './hooks/useFlowerMetrics';
import { useFlowerFilters } from './hooks/useFlowerFilters';
import { useFlowerMutations } from './hooks/useFlowerMutations';
import { FlowerMetricsBar } from './components/FlowerMetricsBar';
import { FlowerToolbar } from './components/FlowerToolbar';
import { FlowerBulkBar } from './components/FlowerBulkBar';
import { FlowerTable } from './components/FlowerTable';
import { FlowerAddModal } from './components/FlowerAddModal';

export interface FlowersTabProps {
    flowers: Flower[];
    onFlowersChange?: (updated: Flower[]) => void;
    isAdmin: boolean;
    isLoading?: boolean;
}

export function FlowersTab({ flowers, onFlowersChange, isAdmin, isLoading = false }: FlowersTabProps) {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

    const metrics = useFlowerMetrics(flowers);
    const filters = useFlowerFilters(flowers);
    const mutations = useFlowerMutations({
        flowers,
        onFlowersChange,
        filteredFlowers: filters.filteredFlowers,
    });

    if (isLoading) {
        return <FlowersTabSkeleton />;
    }

    return (
        <div className="space-y-6 select-none">
            {/* Top Inventory Summary KPI Cards */}
            <FlowerMetricsBar metrics={metrics} />

            {/* Header & Filter Controls Toolbar */}
            <FlowerToolbar
                searchQuery={filters.searchQuery}
                setSearchQuery={filters.setSearchQuery}
                unitFilter={filters.unitFilter}
                setUnitFilter={filters.setUnitFilter}
                stockFilter={filters.stockFilter}
                setStockFilter={filters.setStockFilter}
                isAdmin={isAdmin}
                onOpenAddModal={() => {
                    mutations.setAddError('');
                    mutations.setIsAddModalOpen(true);
                }}
            />

            {/* Bulk Action Controls */}
            {isAdmin && (
                <FlowerBulkBar
                    selectedCount={mutations.selectedIds.length}
                    hasModifiedRows={mutations.hasModifiedRows}
                    isBulkOperating={mutations.isBulkOperating}
                    onBulkAvailability={mutations.handleBulkAvailability}
                    onBulkSaveEdits={mutations.handleBulkSaveEdits}
                />
            )}

            {/* Save/Toggle Error Toast Alert */}
            {mutations.rowError && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                    {mutations.rowError}
                </p>
            )}

            {/* Flowers TanStack Table */}
            <FlowerTable
                data={filters.filteredFlowers}
                isAdmin={isAdmin}
                selectedIds={mutations.selectedIds}
                toggleSelect={mutations.toggleSelect}
                toggleSelectAll={mutations.toggleSelectAll}
                editPrices={mutations.editPrices}
                setEditPrices={mutations.setEditPrices}
                editUnitTypes={mutations.editUnitTypes}
                setEditUnitTypes={mutations.setEditUnitTypes}
                editSizes={mutations.editSizes}
                setEditSizes={mutations.setEditSizes}
                editBundleQtys={mutations.editBundleQtys}
                setEditBundleQtys={mutations.setEditBundleQtys}
                editBundlePrices={mutations.editBundlePrices}
                setEditBundlePrices={mutations.setEditBundlePrices}
                editQtys={mutations.editQtys}
                setEditQtys={mutations.setEditQtys}
                handleSaveFlower={mutations.handleSaveFlower}
                handleToggleAvailability={mutations.handleToggleAvailability}
                isSaving={mutations.isSaving}
                pagination={pagination}
                setPagination={setPagination}
            />

            {/* Add Flower Item Modal */}
            <FlowerAddModal
                isOpen={mutations.isAddModalOpen}
                onClose={() => mutations.setIsAddModalOpen(false)}
                newName={mutations.newName}
                setNewName={mutations.setNewName}
                newUnitType={mutations.newUnitType}
                setNewUnitType={mutations.setNewUnitType}
                newSize={mutations.newSize}
                setNewSize={mutations.setNewSize}
                newPrice={mutations.newPrice}
                setNewPrice={mutations.setNewPrice}
                newQty={mutations.newQty}
                setNewQty={mutations.setNewQty}
                newBundleQty={mutations.newBundleQty}
                setNewBundleQty={mutations.setNewBundleQty}
                newBundlePrice={mutations.newBundlePrice}
                setNewBundlePrice={mutations.setNewBundlePrice}
                addError={mutations.addError}
                setAddError={mutations.setAddError}
                onAdd={mutations.handleAdd}
                isAdding={mutations.isAdding}
            />
        </div>
    );
}

export default FlowersTab;
