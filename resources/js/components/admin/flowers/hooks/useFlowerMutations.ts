import { useState } from 'react';
import { Flower } from '../../../../types';
import { toast } from '../../../ui/Toast';
import { useAddFlower, useUpdateFlower } from '../../../../lib/adminQueries';

interface UseFlowerMutationsProps {
    flowers: Flower[];
    onFlowersChange?: (updated: Flower[]) => void;
    filteredFlowers: Flower[];
}

export function useFlowerMutations({
    flowers,
    onFlowersChange,
    filteredFlowers,
}: UseFlowerMutationsProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newUnitType, setNewUnitType] = useState('stem');
    const [newSize, setNewSize] = useState('');
    const [newBundleQty, setNewBundleQty] = useState('');
    const [newBundlePrice, setNewBundlePrice] = useState('');
    const [newQty, setNewQty] = useState('');
    const [addError, setAddError] = useState('');

    // Selection for Bulk Actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkOperating, setIsBulkOperating] = useState(false);

    // In-row Editing States
    const [editPrices, setEditPrices] = useState<Record<number, string>>({});
    const [editUnitTypes, setEditUnitTypes] = useState<Record<number, string>>({});
    const [editSizes, setEditSizes] = useState<Record<number, string>>({});
    const [editBundleQtys, setEditBundleQtys] = useState<Record<number, string>>({});
    const [editBundlePrices, setEditBundlePrices] = useState<Record<number, string>>({});
    const [editQtys, setEditQtys] = useState<Record<number, string>>({});
    const [rowError, setRowError] = useState('');

    const addFlowerMutation = useAddFlower();
    const updateFlowerMutation = useUpdateFlower();

    const showRowError = (message: string) => {
        setRowError(message);
        setTimeout(() => setRowError(''), 4000);
    };

    const handleAdd = async () => {
        setAddError('');
        const price = parseFloat(newPrice);
        const qty = parseInt(newQty);
        const bundleQty = newBundleQty ? parseInt(newBundleQty) : undefined;
        const bundlePrice = newBundlePrice ? parseFloat(newBundlePrice) : undefined;

        if (!newName.trim() || isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
            const errorMsg = 'Please fill in name, price, and quantity with valid values.';
            setAddError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            const created: Flower = await addFlowerMutation.mutateAsync({
                name: newName.trim(),
                price,
                quantity: qty,
                unit_type: newUnitType || 'stem',
                size: newSize.trim() || undefined,
                bundle_qty: bundleQty,
                bundle_price: bundlePrice,
            });
            onFlowersChange?.([...flowers, created]);
            setIsAddModalOpen(false);
            setNewName('');
            setNewPrice('');
            setNewUnitType('stem');
            setNewSize('');
            setNewBundleQty('');
            setNewBundlePrice('');
            setNewQty('');
            toast.success(`Flower "${created.name}" added successfully!`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to add flower.';
            setAddError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleSaveFlower = async (flower: Flower) => {
        const price = parseFloat(editPrices[flower.id]?.toString() ?? flower.price.toString());
        const qty = parseInt(editQtys[flower.id]?.toString() ?? flower.quantity.toString());
        const unitType = editUnitTypes[flower.id] ?? flower.unit_type ?? 'stem';
        const size = editSizes[flower.id] ?? flower.size ?? '';
        
        const bQtyVal = editBundleQtys[flower.id] !== undefined ? editBundleQtys[flower.id] : (flower.bundle_qty ? flower.bundle_qty.toString() : '');
        const bPriceVal = editBundlePrices[flower.id] !== undefined ? editBundlePrices[flower.id] : (flower.bundle_price ? flower.bundle_price.toString() : '');

        const bundleQty = bQtyVal ? parseInt(bQtyVal) : null;
        const bundlePrice = bPriceVal ? parseFloat(bPriceVal) : null;

        if (isNaN(price) || price < 0 || isNaN(qty) || qty < 0) {
            const errorMsg = 'Please enter a valid price and quantity.';
            showRowError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            const updated: Flower = await updateFlowerMutation.mutateAsync({
                ...flower,
                price,
                quantity: qty,
                unit_type: unitType,
                size: size.trim() || null,
                bundle_qty: bundleQty,
                bundle_price: bundlePrice,
            });
            onFlowersChange?.(flowers.map(f => f.id === updated.id ? updated : f));
            toast.success(`Updated "${updated.name}" successfully!`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to save flower. Please try again.';
            showRowError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleToggleAvailability = async (flower: Flower) => {
        try {
            const updated: Flower = await updateFlowerMutation.mutateAsync({
                ...flower,
                available: !flower.available,
            });
            onFlowersChange?.(flowers.map(f => f.id === updated.id ? updated : f));
            toast.success(`"${updated.name}" is now ${updated.available ? 'In Stock' : 'Out of Stock'}.`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to toggle availability. Please try again.';
            showRowError(errorMsg);
            toast.error(errorMsg);
        }
    };

    // Bulk Availability Action
    const handleBulkAvailability = async (makeAvailable: boolean) => {
        if (selectedIds.length === 0) return;
        setIsBulkOperating(true);
        try {
            const targets = flowers.filter(f => selectedIds.includes(f.id));
            const updatedList = [...flowers];
            
            for (const item of targets) {
                const updated = await updateFlowerMutation.mutateAsync({
                    ...item,
                    available: makeAvailable,
                });
                const idx = updatedList.findIndex(f => f.id === updated.id);
                if (idx !== -1) updatedList[idx] = updated;
            }

            onFlowersChange?.(updatedList);
            setSelectedIds([]);
            toast.success(`Updated availability for ${targets.length} flower varieties.`);
        } catch {
            toast.error('Failed to apply bulk availability updates.');
        } finally {
            setIsBulkOperating(false);
        }
    };

    // Bulk Save All Edits
    const handleBulkSaveEdits = async () => {
        const modifiedIds = Array.from(new Set([
            ...Object.keys(editPrices).map(Number),
            ...Object.keys(editUnitTypes).map(Number),
            ...Object.keys(editSizes).map(Number),
            ...Object.keys(editBundleQtys).map(Number),
            ...Object.keys(editBundlePrices).map(Number),
            ...Object.keys(editQtys).map(Number),
        ]));

        if (modifiedIds.length === 0) {
            toast.info('No unsaved changes found.');
            return;
        }

        setIsBulkOperating(true);
        try {
            const updatedList = [...flowers];
            let successCount = 0;

            for (const id of modifiedIds) {
                const flower = flowers.find(f => f.id === id);
                if (!flower) continue;

                const price = parseFloat(editPrices[id]?.toString() ?? flower.price.toString());
                const qty = parseInt(editQtys[id]?.toString() ?? flower.quantity.toString());
                const unitType = editUnitTypes[id] ?? flower.unit_type ?? 'stem';
                const size = editSizes[id] ?? flower.size ?? '';
                const bQtyVal = editBundleQtys[id] !== undefined ? editBundleQtys[id] : (flower.bundle_qty ? flower.bundle_qty.toString() : '');
                const bPriceVal = editBundlePrices[id] !== undefined ? editBundlePrices[id] : (flower.bundle_price ? flower.bundle_price.toString() : '');

                const bundleQty = bQtyVal ? parseInt(bQtyVal) : null;
                const bundlePrice = bPriceVal ? parseFloat(bPriceVal) : null;

                if (isNaN(price) || price < 0 || isNaN(qty) || qty < 0) continue;

                const updated = await updateFlowerMutation.mutateAsync({
                    ...flower,
                    price,
                    quantity: qty,
                    unit_type: unitType,
                    size: size.trim() || null,
                    bundle_qty: bundleQty,
                    bundle_price: bundlePrice,
                });

                const idx = updatedList.findIndex(f => f.id === updated.id);
                if (idx !== -1) updatedList[idx] = updated;
                successCount++;
            }

            onFlowersChange?.(updatedList);
            setEditPrices({});
            setEditUnitTypes({});
            setEditSizes({});
            setEditBundleQtys({});
            setEditBundlePrices({});
            setEditQtys({});
            toast.success(`Successfully saved changes for ${successCount} items!`);
        } catch {
            toast.error('Failed to save all changes.');
        } finally {
            setIsBulkOperating(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredFlowers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredFlowers.map(f => f.id));
        }
    };

    const hasModifiedRows = Object.keys(editPrices).length > 0 ||
        Object.keys(editUnitTypes).length > 0 ||
        Object.keys(editSizes).length > 0 ||
        Object.keys(editBundleQtys).length > 0 ||
        Object.keys(editBundlePrices).length > 0 ||
        Object.keys(editQtys).length > 0;

    return {
        isAddModalOpen,
        setIsAddModalOpen,
        newName,
        setNewName,
        newPrice,
        setNewPrice,
        newUnitType,
        setNewUnitType,
        newSize,
        setNewSize,
        newBundleQty,
        setNewBundleQty,
        newBundlePrice,
        setNewBundlePrice,
        newQty,
        setNewQty,
        addError,
        setAddError,
        selectedIds,
        setSelectedIds,
        isBulkOperating,
        editPrices,
        setEditPrices,
        editUnitTypes,
        setEditUnitTypes,
        editSizes,
        setEditSizes,
        editBundleQtys,
        setEditBundleQtys,
        editBundlePrices,
        setEditBundlePrices,
        editQtys,
        setEditQtys,
        rowError,
        handleAdd,
        handleSaveFlower,
        handleToggleAvailability,
        handleBulkAvailability,
        handleBulkSaveEdits,
        toggleSelect,
        toggleSelectAll,
        hasModifiedRows,
        isAdding: addFlowerMutation.isPending,
        isSaving: updateFlowerMutation.isPending,
    };
}
