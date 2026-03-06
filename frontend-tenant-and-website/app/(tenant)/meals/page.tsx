'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { FoodIngredient, Meal, School, Allergen, SchoolMealType } from '@/types';
import { Plus, Trash2, Edit2, X, Utensils, Leaf, ShieldAlert, Settings } from 'lucide-react';

type Tab = 'meals' | 'ingredients' | 'allergens' | 'meal-types';

const RISK_LABELS: Record<string, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
const RISK_BADGE: Record<string, string> = { low: 'badge-outline-success', medium: 'badge-outline-warning', high: 'badge-outline-danger' };

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function MealsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('meals');
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    // Allergens (global + tenant)
    const [allergens, setAllergens] = useState<Allergen[]>([]);

    // Meals
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(false);
    const [showMealModal, setShowMealModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [mealForm, setMealForm] = useState({ name: '', meal_type: '', ingredient_ids: [] as number[] });
    const [savingMeal, setSavingMeal] = useState(false);

    // Ingredients
    const [ingredients, setIngredients] = useState<FoodIngredient[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [showIngredientModal, setShowIngredientModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<FoodIngredient | null>(null);
    const [ingredientForm, setIngredientForm] = useState({ name: '', allergen_ids: [] as number[] });
    const [savingIngredient, setSavingIngredient] = useState(false);

    // Tenant allergen CRUD
    const [showAllergenModal, setShowAllergenModal] = useState(false);
    const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null);
    const [allergenForm, setAllergenForm] = useState({ name: '', description: '', risk_level: '' });
    const [savingAllergen, setSavingAllergen] = useState(false);

    // School Meal Types
    const [mealTypes, setMealTypes] = useState<SchoolMealType[]>([]);
    const [loadingMealTypes, setLoadingMealTypes] = useState(false);
    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [editingMealType, setEditingMealType] = useState<SchoolMealType | null>(null);
    const [mealTypeForm, setMealTypeForm] = useState({ name: '' });
    const [savingMealType, setSavingMealType] = useState(false);

    const fetchSchools = useCallback(async () => {
        try {
            const res = await apiClient.get('/schools');
            const data: School[] = res.data?.data ?? [];
            setSchools(data);
            if (data.length > 0 && !selectedSchoolId) {
                setSelectedSchoolId(String(data[0].id));
            }
        } catch { /* sessizce geç */ }
    }, [selectedSchoolId]);

    const fetchAllergens = useCallback(async () => {
        try {
            const res = await apiClient.get('/allergens');
            setAllergens(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
    }, []);

    const fetchMeals = useCallback(async () => {
        if (!selectedSchoolId) return;
        setLoadingMeals(true);
        try {
            const res = await apiClient.get('/meals', { params: { school_id: selectedSchoolId } });
            setMeals(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingMeals(false); }
    }, [selectedSchoolId]);

    const fetchIngredients = useCallback(async () => {
        setLoadingIngredients(true);
        try {
            const res = await apiClient.get('/food-ingredients');
            setIngredients(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingIngredients(false); }
    }, []);

    const fetchMealTypes = useCallback(async () => {
        if (!selectedSchoolId) return;
        setLoadingMealTypes(true);
        try {
            const res = await apiClient.get(`/schools/${selectedSchoolId}/meal-types`);
            setMealTypes(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingMealTypes(false); }
    }, [selectedSchoolId]);

    useEffect(() => { fetchSchools(); }, [fetchSchools]);
    useEffect(() => { fetchAllergens(); }, [fetchAllergens]);
    useEffect(() => {
        if (activeTab === 'meals' && selectedSchoolId) {
            fetchMeals();
            fetchMealTypes();
        }
    }, [activeTab, selectedSchoolId, fetchMeals, fetchMealTypes]);
    useEffect(() => { if (activeTab === 'ingredients') fetchIngredients(); }, [activeTab, fetchIngredients]);
    useEffect(() => { if (activeTab === 'meal-types' && selectedSchoolId) fetchMealTypes(); }, [activeTab, selectedSchoolId, fetchMealTypes]);

    // ── Yemek CRUD ──────────────────────────────────────────────
    const openCreateMeal = () => {
        setEditingMeal(null);
        setMealForm({ name: '', meal_type: mealTypes[0]?.name ?? '', ingredient_ids: [] });
        setShowMealModal(true);
        if (ingredients.length === 0) fetchIngredients();
    };

    const openEditMeal = (meal: Meal) => {
        setEditingMeal(meal);
        setMealForm({
            name: meal.name,
            meal_type: meal.meal_type ?? '',
            ingredient_ids: meal.ingredients?.map(i => i.id) ?? [],
        });
        setShowMealModal(true);
        if (ingredients.length === 0) fetchIngredients();
    };

    const handleMealSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealForm.name.trim()) { toast.error('Yemek adı zorunludur.'); return; }
        if (!selectedSchoolId) { toast.error('Lütfen bir okul seçin.'); return; }
        if (mealForm.ingredient_ids.length === 0) { toast.error('En az bir besin öğesi seçilmelidir.'); return; }

        setSavingMeal(true);
        const payload = { ...mealForm, school_id: Number(selectedSchoolId) };
        try {
            if (editingMeal) {
                await apiClient.put(`/meals/${editingMeal.id}`, payload);
                toast.success('Yemek güncellendi.');
            } else {
                await apiClient.post('/meals', payload);
                toast.success('Yemek oluşturuldu.');
            }
            setShowMealModal(false);
            fetchMeals();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally {
            setSavingMeal(false);
        }
    };

    const handleDeleteMeal = async (meal: Meal) => {
        const result = await Swal.fire({
            title: 'Yemeği Sil', text: `"${meal.name}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal', confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/meals/${meal.id}`);
            toast.success('Yemek silindi.');
            fetchMeals();
        } catch { toast.error('Silme başarısız.'); }
    };

    const toggleIngredient = (id: number) => {
        setMealForm(prev => ({
            ...prev,
            ingredient_ids: prev.ingredient_ids.includes(id)
                ? prev.ingredient_ids.filter(i => i !== id)
                : [...prev.ingredient_ids, id],
        }));
    };

    // ── Besin Öğesi CRUD ────────────────────────────────────────
    const openCreateIngredient = () => {
        setEditingIngredient(null);
        setIngredientForm({ name: '', allergen_ids: [] });
        setShowIngredientModal(true);
        if (allergens.length === 0) fetchAllergens();
    };

    const openEditIngredient = (ing: FoodIngredient) => {
        if (!ing.is_custom) { toast.error('Global besin öğeleri düzenlenemez.'); return; }
        setEditingIngredient(ing);
        setIngredientForm({
            name: ing.name,
            allergen_ids: ing.allergens?.map(a => a.id) ?? [],
        });
        setShowIngredientModal(true);
        if (allergens.length === 0) fetchAllergens();
    };

    const handleIngredientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredientForm.name.trim()) { toast.error('Besin öğesi adı zorunludur.'); return; }
        setSavingIngredient(true);
        const payload = { ...ingredientForm, name: ingredientForm.name.trim().toLowerCase() };
        try {
            if (editingIngredient) {
                await apiClient.put(`/food-ingredients/${editingIngredient.id}`, payload);
                toast.success('Besin öğesi güncellendi.');
            } else {
                await apiClient.post('/food-ingredients', payload);
                toast.success('Besin öğesi eklendi.');
            }
            setShowIngredientModal(false);
            fetchIngredients();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingIngredient(false); }
    };

    const handleDeleteIngredient = async (ing: FoodIngredient) => {
        if (!ing.is_custom) { toast.error('Global besin öğeleri silinemez.'); return; }
        const result = await Swal.fire({
            title: 'Besin Öğesi Sil', text: `"${capitalize(ing.name)}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal', confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/food-ingredients/${ing.id}`);
            toast.success('Besin öğesi silindi.');
            fetchIngredients();
        } catch { toast.error('Silme başarısız.'); }
    };

    const toggleAllergenInIngredient = (id: number) => {
        setIngredientForm(prev => ({
            ...prev,
            allergen_ids: prev.allergen_ids.includes(id)
                ? prev.allergen_ids.filter(a => a !== id)
                : [...prev.allergen_ids, id],
        }));
    };

    // ── Tenant Allerjen CRUD ─────────────────────────────────────
    const openCreateAllergen = () => {
        setEditingAllergen(null);
        setAllergenForm({ name: '', description: '', risk_level: '' });
        setShowAllergenModal(true);
    };

    const openEditAllergen = (allergen: Allergen) => {
        if (allergen.tenant_id === null || allergen.tenant_id === undefined) {
            toast.error('Global allerjenler düzenlenemez.'); return;
        }
        setEditingAllergen(allergen);
        setAllergenForm({ name: allergen.name, description: allergen.description ?? '', risk_level: allergen.risk_level ?? '' });
        setShowAllergenModal(true);
    };

    const handleAllergenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allergenForm.name.trim()) { toast.error('Allerjen adı zorunludur.'); return; }
        setSavingAllergen(true);
        const payload = {
            name: allergenForm.name,
            description: allergenForm.description || null,
            risk_level: allergenForm.risk_level || null,
        };
        try {
            if (editingAllergen) {
                await apiClient.put(`/allergens/${editingAllergen.id}`, payload);
                toast.success('Allerjen güncellendi.');
            } else {
                await apiClient.post('/allergens', payload);
                toast.success('Allerjen eklendi.');
            }
            setShowAllergenModal(false);
            fetchAllergens();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingAllergen(false); }
    };

    const handleDeleteAllergen = async (allergen: Allergen) => {
        if (allergen.tenant_id === null || allergen.tenant_id === undefined) {
            toast.error('Global allerjenler silinemez.'); return;
        }
        const result = await Swal.fire({
            title: 'Allergeni Sil', text: `"${allergen.name}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal', confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/allergens/${allergen.id}`);
            toast.success('Allerjen silindi.');
            fetchAllergens();
        } catch { toast.error('Silme başarısız.'); }
    };

    // ── Öğün Türleri CRUD ───────────────────────────────────────
    const openCreateMealType = () => {
        setEditingMealType(null);
        setMealTypeForm({ name: '' });
        setShowMealTypeModal(true);
    };

    const openEditMealType = (mt: SchoolMealType) => {
        setEditingMealType(mt);
        setMealTypeForm({ name: mt.name });
        setShowMealTypeModal(true);
    };

    const handleMealTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealTypeForm.name.trim()) { toast.error('Öğün türü adı zorunludur.'); return; }
        if (!selectedSchoolId) { toast.error('Lütfen bir okul seçin.'); return; }
        setSavingMealType(true);
        try {
            if (editingMealType) {
                await apiClient.put(`/schools/${selectedSchoolId}/meal-types/${editingMealType.id}`, mealTypeForm);
                toast.success('Öğün türü güncellendi.');
            } else {
                await apiClient.post(`/schools/${selectedSchoolId}/meal-types`, mealTypeForm);
                toast.success('Öğün türü eklendi.');
            }
            setShowMealTypeModal(false);
            fetchMealTypes();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingMealType(false); }
    };

    const handleDeleteMealType = async (mt: SchoolMealType) => {
        const result = await Swal.fire({
            title: 'Öğün Türünü Sil', text: `"${mt.name}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal', confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/schools/${selectedSchoolId}/meal-types/${mt.id}`);
            toast.success('Öğün türü silindi.');
            fetchMealTypes();
        } catch { toast.error('Silme başarısız.'); }
    };

    const tabBtn = (tab: Tab, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
            onClick={() => setActiveTab(tab)}
        >
            {icon}{label}
        </button>
    );

    const globalAllergens = allergens.filter(a => a.tenant_id === null || a.tenant_id === undefined);
    const tenantAllergens = allergens.filter(a => a.tenant_id !== null && a.tenant_id !== undefined);

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Yemek Yönetimi</h1>

            <div className="panel">
                <div className="mb-4 flex gap-2 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    {tabBtn('meals', 'Yemekler', <Utensils className="h-4 w-4" />)}
                    {tabBtn('ingredients', 'Besin Öğeleri', <Leaf className="h-4 w-4" />)}
                    {tabBtn('allergens', 'Allerjenler', <ShieldAlert className="h-4 w-4" />)}
                    {tabBtn('meal-types', 'Öğün Türleri', <Settings className="h-4 w-4" />)}
                </div>

                {/* Okul seçici — Yemekler ve Öğün Türleri tabları için */}
                {(activeTab === 'meals' || activeTab === 'meal-types') && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-dark dark:text-white-light">Okul</label>
                        <select
                            className="form-select mt-1 max-w-xs"
                            value={selectedSchoolId}
                            onChange={e => setSelectedSchoolId(e.target.value)}
                        >
                            {schools.length === 0 && <option value="">Okul yok</option>}
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                {/* ── Yemekler ── */}
                {activeTab === 'meals' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm gap-2"
                                onClick={openCreateMeal}
                                disabled={!selectedSchoolId}
                            >
                                <Plus className="h-4 w-4" />
                                Yemek Ekle
                            </button>
                        </div>

                        {loadingMeals ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : !selectedSchoolId ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Lütfen bir okul seçin.</p>
                        ) : meals.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Henüz yemek eklenmemiş.</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {meals.map(meal => (
                                    <div key={meal.id} className="rounded border border-[#ebedf2] p-4 dark:border-[#1b2e4b]">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-dark dark:text-white">{meal.name}</h3>
                                                {meal.meal_type && (
                                                    <span className="text-xs text-[#888ea8]">{meal.meal_type}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button type="button" className="btn btn-sm btn-outline-primary p-1.5" onClick={() => openEditMeal(meal)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline-danger p-1.5" onClick={() => handleDeleteMeal(meal)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {meal.ingredients.map(i => (
                                                    <span key={i.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{capitalize(i.name)}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Besin Öğeleri ── */}
                {activeTab === 'ingredients' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateIngredient}>
                                <Plus className="h-4 w-4" />
                                Besin Öğesi Ekle
                            </button>
                        </div>

                        {loadingIngredients ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Besin Öğesi</th>
                                            <th>Allerjenler</th>
                                            <th>Tür</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredients.map(ing => (
                                            <tr key={ing.id}>
                                                <td className="font-medium text-dark dark:text-white">{capitalize(ing.name)}</td>
                                                <td>
                                                    <div className="flex flex-wrap gap-1">
                                                        {ing.allergens && ing.allergens.length > 0
                                                            ? ing.allergens.map(a => (
                                                                <span key={a.id} className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{a.name}</span>
                                                            ))
                                                            : <span className="text-xs text-[#888ea8]">—</span>
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${ing.is_custom ? 'badge-outline-info' : 'badge-outline-secondary'}`}>
                                                        {ing.is_custom ? 'Özel' : 'Global'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {ing.is_custom && (
                                                        <div className="flex gap-2">
                                                            <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEditIngredient(ing)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteIngredient(ing)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ── Allerjenler ── */}
                {activeTab === 'allergens' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateAllergen}>
                                <Plus className="h-4 w-4" />
                                Allerjen Ekle
                            </button>
                        </div>

                        {globalAllergens.length > 0 && (
                            <div className="mb-6">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">Global Allerjenler</h3>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {globalAllergens.map(a => (
                                        <div key={a.id} className="flex items-center justify-between rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div>
                                                <p className="font-medium text-dark dark:text-white">{a.name}</p>
                                                {a.risk_level && (
                                                    <span className={`badge ${RISK_BADGE[a.risk_level] ?? 'badge-outline-secondary'} mt-1 text-xs`}>
                                                        {RISK_LABELS[a.risk_level] ?? a.risk_level}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="badge badge-outline-secondary text-xs">Global</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">Kuruma Özel Allerjenler</h3>
                            {tenantAllergens.length === 0 ? (
                                <p className="py-4 text-sm text-[#515365] dark:text-[#888ea8]">Henüz allerjen eklenmemiş.</p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {tenantAllergens.map(a => (
                                        <div key={a.id} className="flex items-start justify-between rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                            <div>
                                                <p className="font-medium text-dark dark:text-white">{a.name}</p>
                                                {a.description && (
                                                    <p className="mt-0.5 text-xs text-[#888ea8]">{a.description}</p>
                                                )}
                                                {a.risk_level && (
                                                    <span className={`badge ${RISK_BADGE[a.risk_level] ?? 'badge-outline-secondary'} mt-1 text-xs`}>
                                                        {RISK_LABELS[a.risk_level] ?? a.risk_level}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <button type="button" className="btn btn-sm btn-outline-primary p-1.5" onClick={() => openEditAllergen(a)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button type="button" className="btn btn-sm btn-outline-danger p-1.5" onClick={() => handleDeleteAllergen(a)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Öğün Türleri ── */}
                {activeTab === 'meal-types' && (
                    <>
                        <div className="mb-4 flex justify-end">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm gap-2"
                                onClick={openCreateMealType}
                                disabled={!selectedSchoolId}
                            >
                                <Plus className="h-4 w-4" />
                                Öğün Türü Ekle
                            </button>
                        </div>

                        {!selectedSchoolId ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Lütfen bir okul seçin.</p>
                        ) : loadingMealTypes ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : mealTypes.length === 0 ? (
                            <p className="py-8 text-center text-[#515365] dark:text-[#888ea8]">Henüz öğün türü eklenmemiş.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>Öğün Türü</th>
                                            <th>Sıra</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mealTypes.map(mt => (
                                            <tr key={mt.id}>
                                                <td className="font-medium text-dark dark:text-white">{mt.name}</td>
                                                <td className="text-sm text-[#515365] dark:text-[#888ea8]">{mt.sort_order ?? 0}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button type="button" className="btn btn-sm btn-outline-primary p-2" onClick={() => openEditMealType(mt)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-danger p-2" onClick={() => handleDeleteMealType(mt)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Yemek Modal */}
            {showMealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">{editingMeal ? 'Yemek Düzenle' : 'Yeni Yemek'}</h2>
                            <button type="button" onClick={() => setShowMealModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleMealSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Yemek Adı *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={mealForm.name}
                                    onChange={e => setMealForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Öğün Türü</label>
                                {mealTypes.length > 0 ? (
                                    <select
                                        className="form-select mt-1"
                                        value={mealForm.meal_type}
                                        onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value }))}
                                    >
                                        <option value="">— Seçin —</option>
                                        {mealTypes.map(mt => <option key={mt.id} value={mt.name}>{mt.name}</option>)}
                                    </select>
                                ) : (
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Öğün türü adı girin..."
                                            value={mealForm.meal_type}
                                            onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value }))}
                                        />
                                        <p className="mt-1 text-xs text-[#888ea8]">
                                            Öğün türleri tanımlamak için &quot;Öğün Türleri&quot; sekmesini kullanın.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                    Besin Öğeleri * <span className="text-xs text-[#888ea8]">(en az 1 seçilmeli)</span>
                                </label>
                                {ingredients.length === 0 && (
                                    <p className="text-sm text-[#888ea8]">Besin öğesi yükleniyor...</p>
                                )}
                                <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                                    {ingredients.map(ing => (
                                        <label
                                            key={ing.id}
                                            className="flex cursor-pointer items-center gap-2 rounded border border-[#ebedf2] p-2 hover:border-primary dark:border-[#1b2e4b]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox"
                                                checked={mealForm.ingredient_ids.includes(ing.id)}
                                                onChange={() => toggleIngredient(ing.id)}
                                            />
                                            <span className="text-sm text-dark dark:text-white">{capitalize(ing.name)}</span>
                                        </label>
                                    ))}
                                </div>
                                {mealForm.ingredient_ids.length === 0 && (
                                    <p className="mt-1 text-xs text-danger">Lütfen en az bir besin öğesi seçin.</p>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingMeal}>
                                    {savingMeal ? 'Kaydediliyor...' : (editingMeal ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowMealModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Besin Öğesi Modal */}
            {showIngredientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingIngredient ? 'Besin Öğesi Düzenle' : 'Yeni Besin Öğesi'}
                            </h2>
                            <button type="button" onClick={() => setShowIngredientModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleIngredientSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Ad *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={ingredientForm.name}
                                    onChange={e => setIngredientForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            {allergens.length > 0 && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                        Allerjenler <span className="text-xs text-[#888ea8]">(isteğe bağlı)</span>
                                    </label>

                                    {globalAllergens.length > 0 && (
                                        <div className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Global</p>
                                            <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                                                {globalAllergens.map(a => (
                                                    <label
                                                        key={a.id}
                                                        className="flex cursor-pointer items-center gap-2 rounded border border-[#ebedf2] p-2 hover:border-primary dark:border-[#1b2e4b]"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox"
                                                            checked={ingredientForm.allergen_ids.includes(a.id)}
                                                            onChange={() => toggleAllergenInIngredient(a.id)}
                                                        />
                                                        <span className="text-sm text-dark dark:text-white">{a.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {tenantAllergens.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#888ea8]">Kuruma Özel</p>
                                            <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                                                {tenantAllergens.map(a => (
                                                    <label
                                                        key={a.id}
                                                        className="flex cursor-pointer items-center gap-2 rounded border border-[#ebedf2] p-2 hover:border-primary dark:border-[#1b2e4b]"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox"
                                                            checked={ingredientForm.allergen_ids.includes(a.id)}
                                                            onChange={() => toggleAllergenInIngredient(a.id)}
                                                        />
                                                        <span className="text-sm text-dark dark:text-white">{a.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingIngredient}>
                                    {savingIngredient ? 'Kaydediliyor...' : (editingIngredient ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowIngredientModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allerjen Modal */}
            {showAllergenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingAllergen ? 'Allerjen Düzenle' : 'Yeni Allerjen'}
                            </h2>
                            <button type="button" onClick={() => setShowAllergenModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAllergenSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Ad *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={allergenForm.name}
                                    onChange={e => setAllergenForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Açıklama</label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={2}
                                    value={allergenForm.description}
                                    onChange={e => setAllergenForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Risk Seviyesi</label>
                                <select
                                    className="form-select mt-1"
                                    value={allergenForm.risk_level}
                                    onChange={e => setAllergenForm(p => ({ ...p, risk_level: e.target.value }))}
                                >
                                    <option value="">Seçin (İsteğe Bağlı)</option>
                                    <option value="low">Düşük</option>
                                    <option value="medium">Orta</option>
                                    <option value="high">Yüksek</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingAllergen}>
                                    {savingAllergen ? 'Kaydediliyor...' : (editingAllergen ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowAllergenModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Öğün Türü Modal */}
            {showMealTypeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingMealType ? 'Öğün Türü Düzenle' : 'Yeni Öğün Türü'}
                            </h2>
                            <button type="button" onClick={() => setShowMealTypeModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleMealTypeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">Ad *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    placeholder="Ör: Kahvaltı, Öğle Yemeği..."
                                    value={mealTypeForm.name}
                                    onChange={e => setMealTypeForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingMealType}>
                                    {savingMealType ? 'Kaydediliyor...' : (editingMealType ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowMealTypeModal(false)}>İptal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
