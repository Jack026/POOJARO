'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Category, Occasion, Festival, KitContent, ProductImage } from '@/lib/data/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Options for dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [mrpRupees, setMrpRupees] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [occasionIds, setOccasionIds] = useState<string[]>([]);
  const [festivalIds, setFestivalIds] = useState<string[]>([]);
  const [stock, setStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isKit, setIsKit] = useState(false);
  const [tags, setTags] = useState('');
  const [howToPrepare, setHowToPrepare] = useState('');
  const [whoIsItFor, setWhoIsItFor] = useState('');
  
  // Dynamic arrays
  const [images, setImages] = useState<ProductImage[]>([]);
  const [contents, setContents] = useState<KitContent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/admin/occasions').then(r => r.json()),
      fetch('/api/admin/festivals').then(r => r.json()),
      fetch(`/api/admin/products/${id}`).then(r => r.ok ? r.json() : Promise.reject('Product not found'))
    ]).then(([cats, occs, fests, product]) => {
      setCategories(cats);
      setOccasions(occs);
      setFestivals(fests);
      
      // Populate product data
      setName(product.name);
      setSlug(product.slug);
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setPriceRupees((product.price / 100).toString());
      setMrpRupees((product.mrp / 100).toString());
      setSku(product.sku || '');
      setCategoryId(product.categoryId || '');
      setOccasionIds(product.occasionIds || []);
      setFestivalIds(product.festivalIds || []);
      setStock(product.stock.toString());
      setLowStockThreshold(product.lowStockThreshold.toString());
      setStatus(product.status);
      setIsFeatured(product.isFeatured);
      setIsKit(product.isKit);
      setTags(product.tags ? product.tags.join(', ') : '');
      setHowToPrepare(product.howToPrepare ? product.howToPrepare.join('\n') : '');
      setWhoIsItFor(product.whoIsItFor || '');
      setImages(product.images && product.images.length > 0 ? product.images : [{ url: '', alt: '', width: 800, height: 800 }]);
      setContents(product.contents || []);
      
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setError('Failed to load product details.');
      setLoading(false);
    });
  }, [id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const toggleMultiSelect = (itemId: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(itemId)) {
      setter(current.filter(i => i !== itemId));
    } else {
      setter([...current, itemId]);
    }
  };

  const handleImageChange = (index: number, field: keyof ProductImage, value: any) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)));
  };

  const addImage = () => setImages([...images, { url: '', alt: '', width: 800, height: 800 }]);
  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  const handleContentChange = (index: number, field: keyof KitContent, value: any) => {
    setContents((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContent = () => setContents([...contents, { name: '', quantity: '1', unit: 'pc' }]);
  const removeContent = (index: number) => setContents(contents.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name) return setError('Name is required');
    if (!priceRupees || parseFloat(priceRupees) <= 0) return setError('Price must be greater than 0');
    if (images.length === 0 || !images[0]?.url) return setError('At least one image is required');

    setSaving(true);
    
    const payload = {
      name,
      slug,
      shortDescription,
      description,
      price: Math.round(parseFloat(priceRupees) * 100),
      mrp: mrpRupees ? Math.round(parseFloat(mrpRupees) * 100) : Math.round(parseFloat(priceRupees) * 100),
      sku,
      categoryId,
      occasionIds,
      festivalIds,
      stock: parseInt(stock, 10),
      lowStockThreshold: parseInt(lowStockThreshold, 10),
      status,
      isFeatured,
      isKit,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      howToPrepare: howToPrepare.split('\n').map(t => t.trim()).filter(Boolean),
      whoIsItFor,
      images: images.filter(img => img.url),
      contents: isKit ? contents.filter(c => c.name) : [],
    };

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        router.push('/admin/products');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update product');
        setSaving(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('Duplicate this product? This will create a copy and take you to the new product form.')) return;
    
    // Create new product data based on current state
    const payload = {
      name: `${name} (Copy)`,
      slug: `${slug}-copy`,
      shortDescription,
      description,
      price: Math.round(parseFloat(priceRupees) * 100),
      mrp: mrpRupees ? Math.round(parseFloat(mrpRupees) * 100) : Math.round(parseFloat(priceRupees) * 100),
      sku: `${sku}-copy`,
      categoryId,
      occasionIds,
      festivalIds,
      stock: parseInt(stock, 10),
      lowStockThreshold: parseInt(lowStockThreshold, 10),
      status: 'draft', // Always duplicate as draft
      isFeatured: false,
      isKit,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      howToPrepare: howToPrepare.split('\n').map(t => t.trim()).filter(Boolean),
      whoIsItFor,
      images: images.filter(img => img.url),
      contents: isKit ? contents.filter(c => c.name) : [],
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        router.push('/admin/products');
      } else {
        alert('Failed to duplicate product');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during duplication');
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="p-10 text-center text-[#3A2118] text-lg">Loading product details...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#3A2118]">Edit Product</h1>
          <div className="flex gap-3">
            <button 
              onClick={handleDuplicate}
              className="px-4 py-2 bg-[#E8DDCA] text-[#3A2118] rounded-md hover:bg-opacity-80 text-sm font-medium"
            >
              Duplicate
            </button>
            <button 
              onClick={() => router.push('/admin/products')}
              className="text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <h2 className="text-lg font-bold text-[#3A2118] mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Name *</label>
                <input type="text" required value={name} onChange={handleNameChange} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Slug *</label>
                <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">SKU</label>
                <input type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Short Description</label>
                <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Full Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <h2 className="text-lg font-bold text-[#3A2118] mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Price (₹) *</label>
                <input type="number" step="0.01" required value={priceRupees} onChange={e => setPriceRupees(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">MRP (₹)</label>
                <input type="number" step="0.01" value={mrpRupees} onChange={e => setMrpRupees(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Stock</label>
                <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Low Stock Threshold</label>
                <input type="number" required value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#3A2118]">Images *</h2>
              <button type="button" onClick={addImage} className="text-[#B78332] text-sm font-medium hover:underline">+ Add Image</button>
            </div>
            <div className="space-y-4">
              {images.map((img, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input type="url" placeholder="Image URL" required value={img.url} onChange={e => handleImageChange(idx, 'url', e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332] mb-2" />
                    <input type="text" placeholder="Alt text" value={img.alt} onChange={e => handleImageChange(idx, 'alt', e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
                  </div>
                  {images.length > 1 && (
                    <button type="button" onClick={() => removeImage(idx)} className="text-red-500 p-2 mt-1 hover:bg-red-50 rounded-md">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Taxonomy */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <h2 className="text-lg font-bold text-[#3A2118] mb-4">Taxonomy & Relations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-2">Occasions</label>
                <div className="max-h-48 overflow-y-auto border border-[#E8DDCA] rounded-md p-3 space-y-2">
                  {occasions.map(occ => (
                    <label key={occ.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={occasionIds.includes(occ.id)} onChange={() => toggleMultiSelect(occ.id, occasionIds, setOccasionIds)} className="h-4 w-4 text-[#B78332] focus:ring-[#B78332] border-[#E8DDCA] rounded" />
                      <span className="text-sm">{occ.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-2">Festivals</label>
                <div className="max-h-48 overflow-y-auto border border-[#E8DDCA] rounded-md p-3 space-y-2">
                  {festivals.map(fest => (
                    <label key={fest.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={festivalIds.includes(fest.id)} onChange={() => toggleMultiSelect(fest.id, festivalIds, setFestivalIds)} className="h-4 w-4 text-[#B78332] focus:ring-[#B78332] border-[#E8DDCA] rounded" />
                      <span className="text-sm">{fest.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Tags (comma-separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. puja, diwali, samagri" className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <h2 className="text-lg font-bold text-[#3A2118] mb-4">Editorial Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">How To Prepare (one step per line)</label>
                <textarea rows={4} value={howToPrepare} onChange={e => setHowToPrepare(e.target.value)} placeholder="Step 1...&#10;Step 2..." className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Who Is It For?</label>
                <input type="text" value={whoIsItFor} onChange={e => setWhoIsItFor(e.target.value)} placeholder="e.g. Perfect for new homeowners" className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]" />
              </div>
            </div>
          </div>

          {/* Kit Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <div className="flex items-center mb-4">
              <input type="checkbox" id="isKit" checked={isKit} onChange={e => setIsKit(e.target.checked)} className="h-5 w-5 text-[#B78332] focus:ring-[#B78332] border-[#E8DDCA] rounded mr-3" />
              <label htmlFor="isKit" className="text-lg font-bold text-[#3A2118] cursor-pointer">This product is a Kit</label>
            </div>
            
            {isKit && (
              <div className="mt-6 border-t border-[#E8DDCA] pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-[#3A2118]">Kit Contents</h3>
                  <button type="button" onClick={addContent} className="text-[#B78332] text-sm font-medium hover:underline">+ Add Item</button>
                </div>
                <div className="space-y-4">
                  {contents.length === 0 && <p className="text-gray-500 text-sm">No items added to kit yet.</p>}
                  {contents.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-[#FAF8F3] p-4 rounded-md border border-[#E8DDCA]">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-[#3A2118] mb-1">Item Name</label>
                          <input type="text" required value={item.name} onChange={e => handleContentChange(idx, 'name', e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#B78332]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#3A2118] mb-1">Quantity</label>
                          <input type="text" required value={item.quantity} onChange={e => handleContentChange(idx, 'quantity', e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#B78332]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#3A2118] mb-1">Unit</label>
                          <input type="text" value={item.unit || ''} onChange={e => handleContentChange(idx, 'unit', e.target.value)} className="w-full border border-[#E8DDCA] rounded-md px-2 py-1 text-sm focus:outline-none focus:border-[#B78332]" placeholder="e.g. pc, gm" />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeContent(idx)} className="text-red-500 p-1 mt-5 hover:bg-red-50 rounded-md">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E8DDCA]">
            <h2 className="text-lg font-bold text-[#3A2118] mb-4">Settings</h2>
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-[#3A2118] mb-1">Status</label>
                <div className="flex items-center gap-3">
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-48 border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setStatus(status === 'archived' ? 'published' : 'archived')}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-2 rounded-md"
                  >
                    {status === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>
              <div className="pt-6">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="h-4 w-4 text-[#B78332] focus:ring-[#B78332] border-[#E8DDCA] rounded mr-2" />
                  <span className="text-sm font-medium text-[#3A2118]">Featured Product</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-[#E8DDCA] pt-6 pb-12">
            <button type="button" onClick={() => router.push('/admin/products')} className="px-6 py-2 border border-[#E8DDCA] text-[#3A2118] rounded-md hover:bg-white font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#B78332] text-white rounded-md hover:bg-opacity-90 font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
