'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import apiClient from '@/lib/apiClient';
import { FoodIngredient, Meal, School, Allergen, SchoolMealType } from '@/types';
import { Plus, Trash2, Edit2, X, Utensils, Leaf, ShieldAlert, Settings, Lock, Stethoscope, Clock, Check, XCircle, Camera } from 'lucide-react';
import AuthImg from '@/components/AuthImg';

type Tab = 'meals' | 'ingredients' | 'allergens' | 'conditions' | 'meal-types';
type HealthSubTab = 'approved' | 'pending';

interface HealthSuggestion {
    id: number;
    name: string;
    description?: string | null;
    risk_level?: string | null;
    suggested_by_user_id: number;
    suggested_by?: { id: number; name: string; surname: string; email: string } | null;
    created_at: string;
}

interface MedicalCondition {
    id: number;
    name: string;
    description?: string | null;
    tenant_id: number | null;
}

const RISK_LABELS: Record<string, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
const RISK_BADGE: Record<string, string> = { low: 'badge-outline-success', medium: 'badge-outline-warning', high: 'badge-outline-danger' };

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function MealsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('meals');
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    // Allergens (global + tenant)
    const [allergens, setAllergens] = useState<Allergen[]>([]);
    const [loadingAllergens, setLoadingAllergens] = useState(false);

    // Meals
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(false);
    const [showMealModal, setShowMealModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [mealForm, setMealForm] = useState({ name: '', meal_type: '', ingredient_ids: [] as number[] });
    const [savingMeal, setSavingMeal] = useState(false);
    const [mealPhotoFile, setMealPhotoFile] = useState<File | null>(null);
    const [mealPhotoPreview, setMealPhotoPreview] = useState<string | null>(null);
    const [existingMealPhotoUrl, setExistingMealPhotoUrl] = useState<string | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    // Ingredients
    const [ingredients, setIngredients] = useState<FoodIngredient[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [showIngredientModal, setShowIngredientModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<FoodIngredient | null>(null);
    const [ingredientForm, setIngredientForm] = useState({ name: '', allergen_ids: [] as number[] });
    const [savingIngredient, setSavingIngredient] = useState(false);

    // Allergen sub-tabs + pending suggestions
    const [allergenSubTab, setAllergenSubTab] = useState<HealthSubTab>('approved');
    const [allergenSuggestions, setAllergenSuggestions] = useState<HealthSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Tenant allergen CRUD
    const [showAllergenModal, setShowAllergenModal] = useState(false);
    const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null);
    const [allergenForm, setAllergenForm] = useState({ name: '', description: '', risk_level: '' });
    const [savingAllergen, setSavingAllergen] = useState(false);

    // Medical conditions
    const [conditions, setConditions] = useState<MedicalCondition[]>([]);
    const [loadingConditions, setLoadingConditions] = useState(false);
    const [conditionSubTab, setConditionSubTab] = useState<HealthSubTab>('approved');
    const [conditionSuggestions, setConditionSuggestions] = useState<HealthSuggestion[]>([]);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
    const [conditionForm, setConditionForm] = useState({ name: '', description: '' });
    const [savingCondition, setSavingCondition] = useState(false);

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
        setLoadingAllergens(true);
        try {
            const res = await apiClient.get('/allergens');
            setAllergens(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingAllergens(false); }
    }, []);

    const fetchConditions = useCallback(async () => {
        setLoadingConditions(true);
        try {
            const res = await apiClient.get('/medical-conditions');
            setConditions(res.data?.data ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingConditions(false); }
    }, []);

    const fetchSuggestions = useCallback(async () => {
        setLoadingSuggestions(true);
        try {
            const res = await apiClient.get('/health-suggestions');
            const data = res.data?.data ?? {};
            setAllergenSuggestions(data.allergens ?? []);
            setConditionSuggestions(data.conditions ?? []);
        } catch { /* sessizce geç */ }
        finally { setLoadingSuggestions(false); }
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
    useEffect(() => {
        if (activeTab === 'conditions') fetchConditions();
    }, [activeTab, fetchConditions]);
    useEffect(() => {
        if ((activeTab === 'allergens' && allergenSubTab === 'pending') ||
            (activeTab === 'conditions' && conditionSubTab === 'pending')) {
            fetchSuggestions();
        }
    }, [activeTab, allergenSubTab, conditionSubTab, fetchSuggestions]);

    // ── Yemek CRUD ──────────────────────────────────────────────
    const openCreateMeal = () => {
        setEditingMeal(null);
        setMealForm({ name: '', meal_type: mealTypes[0]?.name ?? '', ingredient_ids: [] });
        setMealPhotoFile(null);
        setMealPhotoPreview(null);
        setExistingMealPhotoUrl(null);
        setRemovePhoto(false);
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
        setMealPhotoFile(null);
        setMealPhotoPreview(null);
        setExistingMealPhotoUrl(meal.photo_url ?? null);
        setRemovePhoto(false);
        setShowMealModal(true);
        if (ingredients.length === 0) fetchIngredients();
    };

    const handleMealSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealForm.name.trim()) { toast.error('Yemek adı zorunludur.'); return; }
        if (!selectedSchoolId) { toast.error('Lütfen bir okul seçin.'); return; }
        if (mealForm.ingredient_ids.length === 0) { toast.error('En az bir besin öğesi seçilmelidir.'); return; }

        setSavingMeal(true);
        try {
            const fd = new FormData();
            fd.append('name', mealForm.name);
            if (mealForm.meal_type) fd.append('meal_type', mealForm.meal_type);
            mealForm.ingredient_ids.forEach(id => fd.append('ingredient_ids[]', String(id)));
            if (mealPhotoFile) fd.append('photo', mealPhotoFile);

            if (editingMeal) {
                if (removePhoto) fd.append('remove_photo', '1');
                await apiClient.post(`/meals/${editingMeal.id}?_method=PUT`, fd);
                toast.success('Yemek güncellendi.');
            } else {
                fd.append('school_id', selectedSchoolId);
                await apiClient.post('/meals', fd);
                toast.success('Yemek oluşturuldu.');
            }
            setShowMealModal(false);
            fetchMeals();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            const errs = error.response?.data?.errors;
            toast.error(errs ? (Object.values(errs)[0]?.[0] ?? 'Hata oluştu.') : (error.response?.data?.message ?? 'Hata oluştu.'));
        } finally {
            setSavingMeal(false);
        }
    };

    const handleDeleteMeal = async (meal: Meal) => {
        const result = await Swal.fire({
            title: 'Yemeği Sil', text: `"${meal.name}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
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
            showCancelButton: true, confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
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
            showCancelButton: true, confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/allergens/${allergen.id}`);
            toast.success('Allerjen silindi.');
            fetchAllergens();
        } catch { toast.error('Silme başarısız.'); }
    };

    // ── Tıbbi Durum CRUD ─────────────────────────────────────────
    const openCreateCondition = () => {
        setEditingCondition(null);
        setConditionForm({ name: '', description: '' });
        setShowConditionModal(true);
    };

    const openEditCondition = (c: MedicalCondition) => {
        if (c.tenant_id === null || c.tenant_id === undefined) {
            toast.error('Global tıbbi durumlar düzenlenemez.'); return;
        }
        setEditingCondition(c);
        setConditionForm({ name: c.name, description: c.description ?? '' });
        setShowConditionModal(true);
    };

    const handleConditionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conditionForm.name.trim()) { toast.error('Tıbbi durum adı zorunludur.'); return; }
        setSavingCondition(true);
        const payload = { name: conditionForm.name.trim(), description: conditionForm.description || null };
        try {
            if (editingCondition) {
                await apiClient.put(`/medical-conditions/${editingCondition.id}`, payload);
                toast.success('Tıbbi durum güncellendi.');
            } else {
                await apiClient.post('/medical-conditions', payload);
                toast.success('Tıbbi durum eklendi.');
            }
            setShowConditionModal(false);
            fetchConditions();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Hata oluştu.');
        } finally { setSavingCondition(false); }
    };

    const handleDeleteCondition = async (c: MedicalCondition) => {
        if (c.tenant_id === null || c.tenant_id === undefined) {
            toast.error('Global tıbbi durumlar silinemez.'); return;
        }
        const result = await Swal.fire({
            title: 'Tıbbi Durumu Sil', text: `"${c.name}" silinecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/medical-conditions/${c.id}`);
            toast.success('Tıbbi durum silindi.');
            fetchConditions();
        } catch { toast.error('Silme başarısız.'); }
    };

    // ── Sağlık Önerisi Onayla / Reddet ──────────────────────────
    const handleApproveSuggestion = async (type: 'allergen' | 'condition', id: number) => {
        try {
            await apiClient.post('/health-suggestions/approve', { type, id });
            toast.success('Öneri onaylandı ve listeye eklendi.');
            fetchSuggestions();
            if (type === 'allergen') fetchAllergens();
            else fetchConditions();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message ?? 'Onaylama başarısız.');
        }
    };

    const handleRejectSuggestion = async (type: 'allergen' | 'condition', id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Öneriyi Reddet', text: `"${name}" önerisi reddedilecek.`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Reddet', cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.post('/health-suggestions/reject', { type, id });
            toast.success('Öneri reddedildi.');
            fetchSuggestions();
        } catch { toast.error('Reddetme başarısız.'); }
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
            showCancelButton: true, confirmButtonText: t('swal.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#e7515a',
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
    const globalConditions = conditions.filter(c => c.tenant_id === null || c.tenant_id === undefined);
    const tenantConditions = conditions.filter(c => c.tenant_id !== null && c.tenant_id !== undefined);

    /** Seçili besin öğelerinden otomatik türetilen allerjenler (meal modalinde kilitli gösterilir) */
    const lockedAllergens = useMemo(() => {
        const map = new Map<number, string>();
        ingredients
            .filter(ing => mealForm.ingredient_ids.includes(ing.id))
            .forEach(ing => ing.allergens?.forEach(a => map.set(a.id, a.name)));
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [ingredients, mealForm.ingredient_ids]);

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">{t('meals.title')}</h1>

            <div className="panel">
                <div className="mb-4 flex flex-wrap gap-2 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                    {tabBtn('meals', 'Yemekler', <Utensils className="h-4 w-4" />)}
                    {tabBtn('ingredients', 'Besin Öğeleri', <Leaf className="h-4 w-4" />)}
                    {tabBtn('allergens', 'Allerjenler', <ShieldAlert className="h-4 w-4" />)}
                    {tabBtn('conditions', 'Tıbbi Durumlar', <Stethoscope className="h-4 w-4" />)}
                    {tabBtn('meal-types', 'Öğün Türleri', <Settings className="h-4 w-4" />)}
                </div>

                {/* Okul seçici — Yemekler ve Öğün Türleri tabları için */}
                {(activeTab === 'meals' || activeTab === 'meal-types') && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-dark dark:text-white-light">{t('meals.schoolLabel') || 'Okul'}</label>
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
                                    <div key={meal.id} className="overflow-hidden rounded border border-[#ebedf2] dark:border-[#1b2e4b]">
                                        {meal.photo_url && (
                                            <AuthImg
                                                src={meal.photo_url}
                                                alt={meal.name}
                                                className="h-36 w-full object-cover"
                                                fallback={<div className="h-36 w-full animate-pulse bg-gray-100 dark:bg-[#1b2e4b]" />}
                                            />
                                        )}
                                        <div className="p-4">
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
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {meal.ingredients.map(i => (
                                                        <span key={i.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{capitalize(i.name)}</span>
                                                    ))}
                                                </div>
                                                {(() => {
                                                    const mealAllergens = Array.from(
                                                        new Map(
                                                            meal.ingredients
                                                                .flatMap(i => i.allergens ?? [])
                                                                .map(a => [a.id, a])
                                                        ).values()
                                                    );
                                                    return mealAllergens.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {mealAllergens.map(a => (
                                                                <span key={a.id} className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                                                                    <ShieldAlert className="h-3 w-3" />
                                                                    {capitalize(a.name)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                        )}
                                        </div>
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
                                            <th>{t('meals.ingredientCol') || 'Besin Öğesi'}</th>
                                            <th>{t('meals.allergenCol') || 'Allerjenler'}</th>
                                            <th>{t('meals.typeCol') || 'Tür'}</th>
                                            <th>{t('common.actions') || 'İşlemler'}</th>
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
                        {/* Alt sekmeler */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex gap-1 rounded-lg bg-[#f1f3f6] p-1 dark:bg-[#1b2e4b]">
                                <button
                                    type="button"
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${allergenSubTab === 'approved' ? 'bg-white shadow text-dark dark:bg-[#0e1726] dark:text-white' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                                    onClick={() => setAllergenSubTab('approved')}
                                >
                                    Onaylı Allerjenler
                                </button>
                                <button
                                    type="button"
                                    className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${allergenSubTab === 'pending' ? 'bg-white shadow text-dark dark:bg-[#0e1726] dark:text-white' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                                    onClick={() => setAllergenSubTab('pending')}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Bekleyen Öneriler
                                    {allergenSuggestions.length > 0 && (
                                        <span className="rounded-full bg-warning px-1.5 py-0.5 text-xs text-white">{allergenSuggestions.length}</span>
                                    )}
                                </button>
                            </div>
                            {allergenSubTab === 'approved' && (
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateAllergen}>
                                    <Plus className="h-4 w-4" />
                                    Allerjen Ekle
                                </button>
                            )}
                        </div>

                        {/* Onaylı listesi */}
                        {allergenSubTab === 'approved' && (
                            <>
                                {loadingAllergens ? (
                                    <div className="flex h-32 items-center justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    </div>
                                ) : (
                                    <>
                                        {globalAllergens.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">{t('meals.globalAllergens')}</h3>
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
                                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">Kuruma Özel</h3>
                                            {tenantAllergens.length === 0 ? (
                                                <p className="py-4 text-sm text-[#515365] dark:text-[#888ea8]">Henüz kuruma özel allerjen eklenmemiş.</p>
                                            ) : (
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {tenantAllergens.map(a => (
                                                        <div key={a.id} className="flex items-start justify-between rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                            <div>
                                                                <p className="font-medium text-dark dark:text-white">{a.name}</p>
                                                                {a.description && <p className="mt-0.5 text-xs text-[#888ea8]">{a.description}</p>}
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
                            </>
                        )}

                        {/* Bekleyen öneriler */}
                        {allergenSubTab === 'pending' && (
                            loadingSuggestions ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : allergenSuggestions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Clock className="mx-auto mb-2 h-10 w-10 text-[#e0e6ed]" />
                                    <p className="text-sm text-[#888ea8]">Bekleyen allerjen önerisi yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {allergenSuggestions.map(s => (
                                        <div key={s.id} className="flex items-center justify-between rounded border border-warning/30 bg-warning/5 p-4">
                                            <div>
                                                <p className="font-semibold text-dark dark:text-white">{s.name}</p>
                                                {s.description && <p className="mt-0.5 text-xs text-[#888ea8]">{s.description}</p>}
                                                {s.suggested_by ? (
                                                    <p className="mt-1 text-xs text-[#515365] dark:text-[#888ea8]">
                                                        <span className="font-medium">{s.suggested_by.name} {s.suggested_by.surname}</span>
                                                        {' · '}{s.suggested_by.email}
                                                        {' · '}{new Date(s.created_at).toLocaleDateString('tr-TR')}
                                                    </p>
                                                ) : (
                                                    <p className="mt-1 text-xs text-[#888ea8]">{new Date(s.created_at).toLocaleDateString('tr-TR')}</p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success gap-1"
                                                    onClick={() => handleApproveSuggestion('allergen', s.id)}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    Onayla
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger gap-1"
                                                    onClick={() => handleRejectSuggestion('allergen', s.id, s.name)}
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Reddet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}

                {/* ── Tıbbi Durumlar ── */}
                {activeTab === 'conditions' && (
                    <>
                        {/* Alt sekmeler */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex gap-1 rounded-lg bg-[#f1f3f6] p-1 dark:bg-[#1b2e4b]">
                                <button
                                    type="button"
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${conditionSubTab === 'approved' ? 'bg-white shadow text-dark dark:bg-[#0e1726] dark:text-white' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                                    onClick={() => setConditionSubTab('approved')}
                                >
                                    Onaylı Durumlar
                                </button>
                                <button
                                    type="button"
                                    className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${conditionSubTab === 'pending' ? 'bg-white shadow text-dark dark:bg-[#0e1726] dark:text-white' : 'text-[#515365] hover:text-primary dark:text-[#888ea8]'}`}
                                    onClick={() => setConditionSubTab('pending')}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Bekleyen Öneriler
                                    {conditionSuggestions.length > 0 && (
                                        <span className="rounded-full bg-warning px-1.5 py-0.5 text-xs text-white">{conditionSuggestions.length}</span>
                                    )}
                                </button>
                            </div>
                            {conditionSubTab === 'approved' && (
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={openCreateCondition}>
                                    <Plus className="h-4 w-4" />
                                    Tıbbi Durum Ekle
                                </button>
                            )}
                        </div>

                        {/* Onaylı liste */}
                        {conditionSubTab === 'approved' && (
                            loadingConditions ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : (
                                <>
                                    {globalConditions.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">Global Tıbbi Durumlar</h3>
                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                {globalConditions.map(c => (
                                                    <div key={c.id} className="flex items-center justify-between rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                        <div>
                                                            <p className="font-medium text-dark dark:text-white">{c.name}</p>
                                                            {c.description && <p className="mt-0.5 text-xs text-[#888ea8]">{c.description}</p>}
                                                        </div>
                                                        <span className="badge badge-outline-secondary text-xs">Global</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#888ea8]">Kuruma Özel</h3>
                                        {tenantConditions.length === 0 ? (
                                            <p className="py-4 text-sm text-[#515365] dark:text-[#888ea8]">Henüz kuruma özel tıbbi durum eklenmemiş.</p>
                                        ) : (
                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                {tenantConditions.map(c => (
                                                    <div key={c.id} className="flex items-start justify-between rounded border border-[#ebedf2] p-3 dark:border-[#1b2e4b]">
                                                        <div>
                                                            <p className="font-medium text-dark dark:text-white">{c.name}</p>
                                                            {c.description && <p className="mt-0.5 text-xs text-[#888ea8]">{c.description}</p>}
                                                        </div>
                                                        <div className="flex shrink-0 gap-1">
                                                            <button type="button" className="btn btn-sm btn-outline-primary p-1.5" onClick={() => openEditCondition(c)}>
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button type="button" className="btn btn-sm btn-outline-danger p-1.5" onClick={() => handleDeleteCondition(c)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        )}

                        {/* Bekleyen öneriler */}
                        {conditionSubTab === 'pending' && (
                            loadingSuggestions ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : conditionSuggestions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Clock className="mx-auto mb-2 h-10 w-10 text-[#e0e6ed]" />
                                    <p className="text-sm text-[#888ea8]">Bekleyen tıbbi durum önerisi yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {conditionSuggestions.map(s => (
                                        <div key={s.id} className="flex items-center justify-between rounded border border-warning/30 bg-warning/5 p-4">
                                            <div>
                                                <p className="font-semibold text-dark dark:text-white">{s.name}</p>
                                                {s.description && <p className="mt-0.5 text-xs text-[#888ea8]">{s.description}</p>}
                                                {s.suggested_by ? (
                                                    <p className="mt-1 text-xs text-[#515365] dark:text-[#888ea8]">
                                                        <span className="font-medium">{s.suggested_by.name} {s.suggested_by.surname}</span>
                                                        {' · '}{s.suggested_by.email}
                                                        {' · '}{new Date(s.created_at).toLocaleDateString('tr-TR')}
                                                    </p>
                                                ) : (
                                                    <p className="mt-1 text-xs text-[#888ea8]">{new Date(s.created_at).toLocaleDateString('tr-TR')}</p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success gap-1"
                                                    onClick={() => handleApproveSuggestion('condition', s.id)}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    Onayla
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger gap-1"
                                                    onClick={() => handleRejectSuggestion('condition', s.id, s.name)}
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Reddet
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
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
                                            <th>{t('meals.mealType') || 'Öğün Türü'}</th>
                                            <th>{t('common.order') || 'Sıra'}</th>
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
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('meals.mealName') || 'Yemek Adı'} *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={mealForm.name}
                                    onChange={e => setMealForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('meals.mealType') || 'Öğün Türü'}</label>
                                <select
                                    className="form-select mt-1"
                                    value={mealForm.meal_type}
                                    onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value }))}
                                    disabled={mealTypes.length === 0}
                                >
                                    <option value="">— Seçin —</option>
                                    {mealTypes.map(mt => <option key={mt.id} value={mt.name}>{mt.name}</option>)}
                                </select>
                                {mealTypes.length === 0 && (
                                    <p className="mt-1 text-xs text-[#888ea8]">
                                        Öğün türü tanımlamak için &quot;Öğün Türleri&quot; sekmesini kullanın.
                                    </p>
                                )}
                            </div>

                            {/* Fotoğraf */}
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">
                                    Fotoğraf <span className="text-xs text-[#888ea8]">(isteğe bağlı, maks. 5 MB)</span>
                                </label>
                                <div className="mt-1">
                                    {/* Mevcut fotoğraf önizleme */}
                                    {!mealPhotoPreview && existingMealPhotoUrl && !removePhoto && (
                                        <div className="mb-2 flex items-center gap-3">
                                            <AuthImg
                                                src={existingMealPhotoUrl}
                                                alt="Mevcut fotoğraf"
                                                className="h-20 w-28 rounded-lg object-cover"
                                                fallback={<div className="h-20 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-[#1b2e4b]" />}
                                            />
                                            <button
                                                type="button"
                                                className="text-xs text-danger hover:underline"
                                                onClick={() => { setRemovePhoto(true); setExistingMealPhotoUrl(null); }}
                                            >
                                                Fotoğrafı Kaldır
                                            </button>
                                        </div>
                                    )}
                                    {/* Yeni fotoğraf önizleme */}
                                    {mealPhotoPreview && (
                                        <div className="mb-2 flex items-center gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={mealPhotoPreview} alt="Önizleme" className="h-20 w-28 rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                className="text-xs text-danger hover:underline"
                                                onClick={() => { setMealPhotoFile(null); setMealPhotoPreview(null); }}
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    )}
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#e0e6ed] px-4 py-3 text-sm text-[#515365] hover:border-primary hover:text-primary dark:border-[#1b2e4b]">
                                        <Camera className="h-4 w-4" />
                                        <span>{mealPhotoFile ? mealPhotoFile.name : 'Fotoğraf seç...'}</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setMealPhotoFile(file);
                                                setMealPhotoPreview(URL.createObjectURL(file));
                                                setRemovePhoto(false);
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
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

                            {lockedAllergens.length > 0 && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                        Tespit Edilen Allerjenler{' '}
                                        <span className="text-xs text-[#888ea8]">(besin öğelerinden otomatik, kaldırılamaz)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {lockedAllergens.map(a => (
                                            <button
                                                key={a.id}
                                                type="button"
                                                className="flex cursor-not-allowed items-center gap-1 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger"
                                                onClick={() => toast.error('Bu besin öğesi alerjen içermektedir, kaldırılamaz.')}
                                            >
                                                <Lock className="h-3 w-3" />
                                                {capitalize(a.name)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingMeal}>
                                    {savingMeal ? t('common.loading') : (editingMeal ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowMealModal(false)}>{t('common.cancel')}</button>
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
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.name') || 'Ad'} *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={ingredientForm.name}
                                    onChange={e => setIngredientForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white-light">
                                    Allerjenler <span className="text-xs text-[#888ea8]">(isteğe bağlı)</span>
                                </label>

                                {loadingAllergens ? (
                                    <div className="flex items-center gap-2 text-sm text-[#888ea8]">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        Allerjenler yükleniyor...
                                    </div>
                                ) : allergens.length === 0 ? (
                                    <p className="text-xs text-[#888ea8]">
                                        Henüz allerjen tanımlanmamış.{' '}
                                        <button type="button" className="text-primary underline" onClick={() => { setShowIngredientModal(false); setActiveTab('allergens'); }}>
                                            Allerjen eklemek için tıklayın
                                        </button>
                                    </p>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingIngredient}>
                                    {savingIngredient ? t('common.loading') : (editingIngredient ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowIngredientModal(false)}>{t('common.cancel')}</button>
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
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.name') || 'Ad'} *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={allergenForm.name}
                                    onChange={e => setAllergenForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.description') || 'Açıklama'}</label>
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
                                    {savingAllergen ? t('common.loading') : (editingAllergen ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowAllergenModal(false)}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tıbbi Durum Modal */}
            {showConditionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-[#0e1726]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-dark dark:text-white">
                                {editingCondition ? 'Tıbbi Durum Düzenle' : 'Yeni Tıbbi Durum'}
                            </h2>
                            <button type="button" onClick={() => setShowConditionModal(false)} className="text-[#888ea8] hover:text-danger">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleConditionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.name') || 'Ad'} *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    value={conditionForm.name}
                                    onChange={e => setConditionForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.description') || 'Açıklama'}</label>
                                <textarea
                                    className="form-input mt-1"
                                    rows={2}
                                    value={conditionForm.description}
                                    onChange={e => setConditionForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn btn-primary flex-1" disabled={savingCondition}>
                                    {savingCondition ? t('common.loading') : (editingCondition ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowConditionModal(false)}>{t('common.cancel')}</button>
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
                                <label className="block text-sm font-medium text-dark dark:text-white-light">{t('common.name') || 'Ad'} *</label>
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
                                    {savingMealType ? t('common.loading') : (editingMealType ? 'Güncelle' : 'Kaydet')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary flex-1" onClick={() => setShowMealTypeModal(false)}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
