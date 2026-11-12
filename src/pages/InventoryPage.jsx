import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, inventoryAPI, productsAPI } from '../api';
import { Loading } from '../components/common';

const listData = (data) => Array.isArray(data) ? data : data?.results || [];
const emptyProduct = { product_name: '', sku: '', description: '', price: '', discount_price: '', category_id: '', brand_id: '', is_available: true };
const emptyStock = { product_id: '', color_id: '', size_id: '', quantity: '0' };

export const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tab, setTab] = useState('stock');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockForm, setStockForm] = useState(emptyStock);
  const [editingStock, setEditingStock] = useState(null);
  const [imageProduct, setImageProduct] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', link: '', sort_order: '0', image: null });
  const [entityForm, setEntityForm] = useState({ type: 'category', id: null, name: '', description: '', parent_id: '' });
  const [availability, setAvailability] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState({ product_id: '', color_id: '', size_id: '' });
  const [stockFilters, setStockFilters] = useState({ category: '', brand: '', sort: 'product-asc' });

  const loadData = useCallback(async () => {
    const [inventoryResponse, productResponse, categoryResponse, brandResponse, colorResponse, sizeResponse, bannerResponse] = await Promise.all([
      inventoryAPI.getInventory(), productsAPI.getProducts(), productsAPI.getCategories(), productsAPI.getBrands(), productsAPI.getColors(), productsAPI.getSizes(), productsAPI.getBanners(),
    ]);
    setInventory(listData(inventoryResponse.data));
    setProducts(listData(productResponse.data));
    setCategories(listData(categoryResponse.data));
    setBrands(listData(brandResponse.data));
    setColors(listData(colorResponse.data));
    setSizes(listData(sizeResponse.data));
    setBanners(listData(bannerResponse.data));
  }, []);

  useEffect(() => {
    loadData().catch(() => setError('Could not load catalog and inventory data.')).finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (!imageFile) { setPreview(''); return undefined; }
    const previewUrl = URL.createObjectURL(imageFile);
    setPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const lowStock = inventory.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 5).length;
  const totalUnits = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const allImages = useMemo(() => products.flatMap((product) => (product.images || []).map((image) => ({ ...image, productName: product.product_name }))), [products]);
  const visibleInventory = useMemo(() => inventory
    .filter((item) => !stockFilters.category || String(item.product?.category?.id) === stockFilters.category)
    .filter((item) => !stockFilters.brand || String(item.product?.brand?.id) === stockFilters.brand)
    .slice()
    .sort((a, b) => {
      if (stockFilters.sort === 'quantity-asc') return Number(a.quantity) - Number(b.quantity);
      if (stockFilters.sort === 'quantity-desc') return Number(b.quantity) - Number(a.quantity);
      if (stockFilters.sort === 'product-desc') return (b.product?.product_name || '').localeCompare(a.product?.product_name || '');
      return (a.product?.product_name || '').localeCompare(b.product?.product_name || '');
    }), [inventory, stockFilters]);

  const runAction = async (action, successMessage) => {
    setSaving(true); setError(''); setNotice('');
    try { await action(); await loadData(); setNotice(successMessage); return true; }
    catch (err) { setError(err.response?.data?.detail || err.response?.data?.error || 'The request could not be completed. Check the fields and try again.'); return false; }
    finally { setSaving(false); }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const payload = { ...productForm, sku: productForm.sku.trim() || null, price: Number(productForm.price), discount_price: productForm.discount_price === '' ? 0 : Number(productForm.discount_price), category_id: Number(productForm.category_id), brand_id: Number(productForm.brand_id) };
    const saved = await runAction(() => editingProduct ? productsAPI.updateProduct(editingProduct, payload) : productsAPI.createProduct(payload), editingProduct ? 'Product details updated.' : 'Product added to the catalog.');
    if (saved) { setProductForm(emptyProduct); setEditingProduct(null); }
  };

  const editProduct = (product) => {
    setTab('catalog'); setEditingProduct(product.id);
    setProductForm({ product_name: product.product_name || '', sku: product.sku || '', description: product.description || '', price: product.price || '', discount_price: Number(product.discount_price) > 0 ? product.discount_price : '', category_id: product.category?.id || '', brand_id: product.brand?.id || '', is_available: product.is_available !== false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (product) => {
    if (!window.confirm(`Delete â€œ${product.product_name}â€ and its related stock?`)) return;
    runAction(() => productsAPI.deleteProduct(product.id), 'Product deleted.');
  };

  const saveStock = async (event) => {
    event.preventDefault();
    const payload = { product_id: Number(stockForm.product_id), color_id: Number(stockForm.color_id), size_id: Number(stockForm.size_id), quantity: Number(stockForm.quantity) };
    const saved = await runAction(() => editingStock ? inventoryAPI.updateInventory(editingStock, payload) : inventoryAPI.createInventory(payload), editingStock ? 'Stock option updated.' : 'Stock option added.');
    if (saved) { setStockForm(emptyStock); setEditingStock(null); }
  };

  const editStock = (item) => {
    setEditingStock(item.id); setStockForm({ product_id: item.product?.id || '', color_id: item.color?.id || '', size_id: item.size?.id || '', quantity: String(item.quantity) });
    document.querySelector('.admin-stock-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteStock = (item) => {
    if (!window.confirm(`Remove the ${item.product?.product_name || 'selected'} stock option?`)) return;
    runAction(() => inventoryAPI.deleteInventory(item.id), 'Stock option removed.');
  };

  const uploadImage = async (event) => {
    event.preventDefault();
    if (!imageProduct || !imageFile) { setError('Choose a product and an image file first.'); return; }
    const payload = new FormData(); payload.append('productimg', imageProduct); payload.append('image', imageFile);
    const saved = await runAction(() => productsAPI.createProductImage(payload), 'Product image uploaded and saved.');
    if (saved) setImageFile(null);
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    if (!bannerForm.image) { setError('Choose a banner image first.'); return; }
    const payload = new FormData();
    Object.entries(bannerForm).forEach(([key, value]) => { if (value !== null && value !== '') payload.append(key, value); });
    const saved = await runAction(() => productsAPI.createBanner(payload), 'Homepage banner created.');
    if (saved) setBannerForm({ title: '', subtitle: '', link: '', sort_order: '0', image: null });
  };

  const deleteBanner = (banner) => {
    if (!window.confirm(`Delete the homepage banner “${banner.title}”?`)) return;
    runAction(() => productsAPI.deleteBanner(banner.id), 'Banner removed.');
  };

  const deleteImage = (image) => {
    if (!window.confirm(`Delete an image for â€œ${image.productName}â€?`)) return;
    runAction(() => productsAPI.deleteProductImage(image.id), 'Product image removed.');
  };

  const saveEntity = async (event) => {
    event.preventDefault();
    const isCategory = entityForm.type === 'category';
    const create = isCategory ? productsAPI.createCategory : productsAPI.createBrand;
    const update = isCategory ? productsAPI.updateCategory : productsAPI.updateBrand;
    const payload = { [isCategory ? 'category_name' : 'brand_name']: entityForm.name, description: entityForm.description, ...(isCategory ? { parent_id: entityForm.parent_id || null } : {}) };
    const saved = await runAction(() => entityForm.id ? update(entityForm.id, payload) : create(payload), `${isCategory ? 'Category' : 'Brand'} ${entityForm.id ? 'updated' : 'created'}.`);
    if (saved) setEntityForm((current) => ({ ...current, id: null, name: '', description: '', parent_id: '' }));
  };

  const removeEntity = (type, item) => {
    const categoryType = type === 'category';
    if (!window.confirm(`Delete â€œ${categoryType ? item.category_name : item.brand_name}â€? Products using it may also be removed.`)) return;
    runAction(() => categoryType ? productsAPI.deleteCategory(item.id) : productsAPI.deleteBrand(item.id), `${categoryType ? 'Category' : 'Brand'} deleted.`);
  };

  const checkAvailability = async (event) => {
    event.preventDefault(); setError(''); setAvailability(null);
    try { const { data } = await inventoryAPI.checkAvailability(availabilityForm); setAvailability(data); }
    catch (err) { setError(err.response?.data?.error || err.response?.data?.detail || 'Could not check availability.'); }
  };

  if (loading) return <Loading />;

  return (
    <main className="page inventory-page admin-catalog-page">
      <div className="admin-page-heading"><div><p className="eyebrow">URBANTHREAD Â· ADMIN STUDIO</p><h1>Catalog & inventory</h1><p>Manage products, product photography, and stock options from one place.</p></div><div className="admin-heading-actions"><a className="admin-preview-link" href={`${API_BASE_URL}/api/docs/`} target="_blank" rel="noreferrer">API documentation â†—</a><Link className="admin-preview-link" to="/products">View storefront â†—</Link></div></div>
      {error && <div className="error" role="alert">{error}</div>}{notice && <div className="success" role="status">{notice}</div>}
      <div className="admin-stat-grid"><div className="admin-stat-card"><span>CATALOG</span><strong>{products.length}</strong><small>Products</small></div><div className="admin-stat-card"><span>AVAILABLE STOCK</span><strong>{totalUnits.toLocaleString()}</strong><small>Units across all options</small></div><div className="admin-stat-card"><span>NEEDS ATTENTION</span><strong>{lowStock}</strong><small>Low stock options</small></div><div className="admin-stat-card"><span>PRODUCT PHOTOGRAPHY</span><strong>{allImages.length}</strong><small>Images on products</small></div></div>
      <div className="admin-tabs" role="tablist" aria-label="Catalog management">
        {[['stock', 'Stock & variants'], ['catalog', 'Products & images'], ['taxonomy', 'Categories & brands']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setError(''); }}>{label}</button>)}
      </div>

      {tab === 'stock' && <div className="admin-workspace">
        <section className="admin-panel admin-stock-form"><div className="admin-panel-heading"><div><span className="admin-step">01 Â· STOCK OPTION</span><h2>{editingStock ? 'Edit stock option' : 'Add stock option'}</h2></div></div>
          <form onSubmit={saveStock} className="admin-form-grid">
            <label>Product<select required value={stockForm.product_id} onChange={(e) => setStockForm({ ...stockForm, product_id: e.target.value })}><option value="">Choose product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}</select></label>
            <label>Color<select required value={stockForm.color_id} onChange={(e) => setStockForm({ ...stockForm, color_id: e.target.value })}><option value="">Choose color</option>{colors.map((c) => <option key={c.id} value={c.id}>{c.color}</option>)}</select></label>
            <label>Size<select required value={stockForm.size_id} onChange={(e) => setStockForm({ ...stockForm, size_id: e.target.value })}><option value="">Choose size</option>{sizes.map((s) => <option key={s.id} value={s.id}>{s.size_type}</option>)}</select></label>
            <label>Quantity<input required type="number" min="0" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} /></label>
            <div className="admin-form-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Savingâ€¦' : editingStock ? 'Save stock' : 'Add stock option'}</button>{editingStock && <button className="admin-quiet-button" type="button" onClick={() => { setEditingStock(null); setStockForm(emptyStock); }}>Cancel</button>}</div>
          </form>
        </section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">02 Â· STOCK LOOKUP</span><h2>Check a product option</h2></div></div>
          <form className="admin-form-grid" onSubmit={checkAvailability}>
            <label>Product<select required value={availabilityForm.product_id} onChange={(e) => setAvailabilityForm({ ...availabilityForm, product_id: e.target.value })}><option value="">Choose product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}</select></label>
            <label>Color<select required value={availabilityForm.color_id} onChange={(e) => setAvailabilityForm({ ...availabilityForm, color_id: e.target.value })}><option value="">Choose color</option>{colors.map((c) => <option key={c.id} value={c.id}>{c.color}</option>)}</select></label>
            <label>Size<select required value={availabilityForm.size_id} onChange={(e) => setAvailabilityForm({ ...availabilityForm, size_id: e.target.value })}><option value="">Choose size</option>{sizes.map((s) => <option key={s.id} value={s.id}>{s.size_type}</option>)}</select></label>
            <div className="admin-form-actions"><button className="btn-secondary" type="submit">Check availability</button>{availability && <span className={availability.available ? 'stock in-stock' : 'stock out-of-stock'}>{availability.available ? `${availability.quantity} available` : 'Out of stock'}</span>}</div>
          </form>
        </section>
        <section className="admin-panel admin-panel-wide"><div className="admin-panel-heading"><div><span className="admin-step">03 - LIVE STOCK</span><h2>Inventory by variant</h2></div><span className="collection-count">{visibleInventory.length} of {inventory.length} options</span></div>
          <div className="admin-stock-filters" aria-label="Filter and sort inventory">
            <label>Category<select value={stockFilters.category} onChange={(e) => setStockFilters({ ...stockFilters, category: e.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>
            <label>Brand<select value={stockFilters.brand} onChange={(e) => setStockFilters({ ...stockFilters, brand: e.target.value })}><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brand_name}</option>)}</select></label>
            <label>Sort by<select value={stockFilters.sort} onChange={(e) => setStockFilters({ ...stockFilters, sort: e.target.value })}><option value="product-asc">Product name (A-Z)</option><option value="product-desc">Product name (Z-A)</option><option value="quantity-asc">Quantity (low to high)</option><option value="quantity-desc">Quantity (high to low)</option></select></label>
            {(stockFilters.category || stockFilters.brand) && <button className="admin-quiet-button" type="button" onClick={() => setStockFilters((current) => ({ ...current, category: '', brand: '' }))}>Clear filters</button>}
          </div>
          {visibleInventory.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Brand</th><th>Color</th><th>Size</th><th>Quantity</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleInventory.map((item) => <tr key={item.id}><td><strong>{item.product?.product_name}</strong></td><td>{item.product?.category?.category_name || '-'}</td><td>{item.product?.brand?.brand_name || '-'}</td><td>{item.color?.color}</td><td>{item.size?.size_type}</td><td>{item.quantity}</td><td><span className={`stock ${item.quantity > 5 ? 'in-stock' : item.quantity > 0 ? 'low-stock' : 'out-of-stock'}`}>{item.quantity > 5 ? 'In stock' : item.quantity > 0 ? 'Low stock' : 'Out of stock'}</span></td><td><div className="admin-row-actions"><button type="button" onClick={() => editStock(item)}>Edit</button><button type="button" className="danger" onClick={() => deleteStock(item)}>Remove</button></div></td></tr>)}</tbody></table></div> : <div className="empty-cart">{inventory.length ? 'No stock options match these filters.' : 'No inventory options yet. Add your first one above.'}</div>}
        </section>
      </div>}

      {tab === 'catalog' && <div className="admin-catalog-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-step">01 · PRODUCT DETAILS</span><h2>{editingProduct ? 'Edit product' : 'Add a product'}</h2></div></div>
          <form onSubmit={saveProduct} className="admin-form-grid">
            <label className="admin-field-wide">Product name<input required maxLength="100" value={productForm.product_name} onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })} /></label>
            <label>SKU (optional)<input maxLength="40" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="e.g. UT-TEE-001" /></label>
            <label>Category<select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}><option value="">Choose category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}</select></label>
            <label>Brand<select required value={productForm.brand_id} onChange={(e) => setProductForm({ ...productForm, brand_id: e.target.value })}><option value="">Choose brand</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.brand_name}</option>)}</select></label>
            <label>Price (BDT)<input required type="number" min="0" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></label>
            <label>Sale price (optional)<input type="number" min="0" step="0.01" value={productForm.discount_price} onChange={(e) => setProductForm({ ...productForm, discount_price: e.target.value })} /></label>
            <label className="admin-field-wide">Description<textarea rows="4" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={productForm.is_available} onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })} /> Show as available in the storefront</label>
            <div className="admin-form-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}</button>{editingProduct && <button className="admin-quiet-button" type="button" onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); }}>Cancel</button>}</div>
          </form>
        </section>
        <section className="admin-panel admin-image-upload">
          <div className="admin-panel-heading"><div><span className="admin-step">02 · PRODUCT PHOTOGRAPHY</span><h2>Upload product images</h2></div></div>
          <form onSubmit={uploadImage} className="admin-upload-form">
            <label>Product<select required value={imageProduct} onChange={(e) => setImageProduct(e.target.value)}><option value="">Choose product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}</select></label>
            <label className="upload-dropzone" htmlFor="product-image-file">{preview ? <img src={preview} alt="Selected product preview" /> : <><strong>Select a product image</strong><small>JPG, PNG, or WebP</small></>}<input id="product-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required /></label>
            {imageFile && <p className="selected-file-name">{imageFile.name}</p>}
            <button className="btn-submit" disabled={saving || !imageProduct || !imageFile}>{saving ? 'Uploading...' : 'Upload image'}</button>
          </form>
        </section>
        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-heading"><div><span className="admin-step">03 · CATALOG</span><h2>Products in your store</h2></div><span className="collection-count">{products.length} products</span></div>
          <div className="admin-product-grid">{products.map((product) => <article className="admin-product-card" key={product.id}><div className="admin-product-image">{product.images?.[0]?.image ? <img src={product.images[0].image} alt={product.product_name} /> : <span>No product image</span>}</div><div className="admin-product-copy"><p>{product.category?.category_name || 'Uncategorised'} · {product.brand?.brand_name || 'No brand'}</p><h3>{product.product_name}</h3><strong>৳{Number(product.discount_price) > 0 ? product.discount_price : product.price}</strong><div className="admin-row-actions"><button type="button" onClick={() => editProduct(product)}>Edit details</button><Link to={`/product/${product.id}`}>Preview</Link><button type="button" className="danger" onClick={() => deleteProduct(product)}>Delete</button></div></div></article>)}</div>
          {allImages.length > 0 && <div className="admin-image-library"><div className="admin-panel-heading"><div><span className="admin-step">IMAGE LIBRARY</span><h2>Uploaded product images</h2></div></div><div className="admin-image-grid">{allImages.map((image) => <article key={image.id}><img src={image.image} alt={image.productName} /><div><strong>{image.productName}</strong><button type="button" className="danger" onClick={() => deleteImage(image)}>Remove</button></div></article>)}</div></div>}
        </section>
        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-heading"><div><span className="admin-step">HOMEPAGE CONTENT</span><h2>Banners & featured slides</h2></div><span className="collection-count">{banners.length} banners</span></div>
          <form className="admin-form-grid" onSubmit={saveBanner}>
            <label>Title<input required maxLength="120" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></label>
            <label>Subtitle<input maxLength="240" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} /></label>
            <label>Link<input value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} placeholder="/products" /></label>
            <label>Position<input type="number" min="0" value={bannerForm.sort_order} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: e.target.value })} /></label>
            <label>Banner image<input required type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.files?.[0] || null })} /></label>
            <div className="admin-form-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Add banner'}</button></div>
          </form>
          <div className="admin-entity-list">{banners.map((banner) => <div key={banner.id}><span><strong>{banner.title}</strong><small>{banner.subtitle || 'No subtitle'} · {banner.is_active ? 'Shown on storefront' : 'Hidden'}</small></span><div className="admin-row-actions"><button type="button" onClick={() => runAction(() => productsAPI.updateBanner(banner.id, { is_active: !banner.is_active }), banner.is_active ? 'Banner hidden.' : 'Banner published.')}>{banner.is_active ? 'Hide' : 'Publish'}</button><button type="button" className="danger" onClick={() => deleteBanner(banner)}>Delete</button></div></div>)}</div>
        </section>
      </div>}

      {tab === 'taxonomy' && <div className="admin-taxonomy-grid">{[['category', 'Categories', categories, 'category_name'], ['brand', 'Brands', brands, 'brand_name']].map(([type, title, list, nameKey]) => <section className="admin-panel" key={type}>
        <div className="admin-panel-heading"><div><span className="admin-step">CATALOG STRUCTURE</span><h2>{title}</h2></div><span className="collection-count">{list.length} total</span></div>
        <form className="admin-form-grid" onSubmit={saveEntity}>
          <label className="admin-field-wide">{entityForm.type === type && entityForm.id ? `Edit ${type}` : `New ${type}`}<input required maxLength="100" value={entityForm.type === type ? entityForm.name : ''} onChange={(e) => setEntityForm({ type, id: entityForm.type === type ? entityForm.id : null, name: e.target.value, description: entityForm.type === type ? entityForm.description : '', parent_id: entityForm.type === type ? entityForm.parent_id : '' })} placeholder={`Name this ${type}`} /></label>
          {type === 'category' && <label className="admin-field-wide">Parent category<select value={entityForm.type === type ? entityForm.parent_id || '' : ''} onChange={(e) => setEntityForm({ ...entityForm, type, parent_id: e.target.value })}><option value="">Top-level category</option>{categories.filter((category) => !category.parent && category.id !== entityForm.id).map((category) => <option key={category.id} value={category.id}>{category.category_name}</option>)}</select></label>}
          <label className="admin-field-wide">Description<textarea rows="2" value={entityForm.type === type ? entityForm.description : ''} onChange={(e) => setEntityForm({ ...entityForm, type, description: e.target.value })} /></label>
          <div className="admin-form-actions"><button className="btn-submit" disabled={saving}>{entityForm.type === type && entityForm.id ? 'Save changes' : `Create ${type}`}</button>{entityForm.type === type && entityForm.id && <button type="button" className="admin-quiet-button" onClick={() => setEntityForm({ type, id: null, name: '', description: '', parent_id: '' })}>Cancel</button>}</div>
        </form>
        <div className="admin-entity-list">{list.map((item) => <div key={item.id}><span><strong>{item[nameKey]}</strong><small>{type === 'category' && item.parent ? `Subcategory of ${categories.find((category) => category.id === item.parent)?.category_name || 'category'} · ` : ''}{item.description || 'No description'}</small></span><div className="admin-row-actions"><button type="button" onClick={() => setEntityForm({ type, id: item.id, name: item[nameKey], description: item.description || '', parent_id: item.parent || '' })}>Edit</button><button type="button" className="danger" onClick={() => removeEntity(type, item)}>Delete</button></div></div>)}</div>
      </section>)}</div>}
    </main>
  );
};
