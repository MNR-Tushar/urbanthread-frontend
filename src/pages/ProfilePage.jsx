import { useEffect, useState } from 'react';
import { authAPI } from '../api';
import { Loading } from '../components/common';

const emptyAddress = { full_name: '', phone: '', address: '', city: '', state: '', pincode: '' };
const listData = (data) => data?.results || data || [];

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ phone: '', gender: '', date_of_birth: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', phone: '', address: '' });
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressEditForm, setAddressEditForm] = useState(emptyAddress);
  const [addingAddress, setAddingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAddresses = async () => {
    const { data } = await authAPI.getAddresses();
    setAddresses(listData(data));
  };

  useEffect(() => {
    Promise.all([authAPI.getUser(), authAPI.getAddresses(), authAPI.getProfiles()])
      .then(([userRes, addressRes, profileRes]) => {
        setUser(userRes.data);
        setForm({ username: userRes.data.username || '', first_name: userRes.data.first_name || '', last_name: userRes.data.last_name || '', phone: userRes.data.phone || '', address: userRes.data.address || '' });
        setAddresses(listData(addressRes.data));
        const currentProfile = listData(profileRes.data).find((item) => Number(item.user) === Number(userRes.data.id)) || null;
        setCustomerProfile(currentProfile);
        setProfileForm({ phone: currentProfile?.phone || '', gender: currentProfile?.gender || '', date_of_birth: currentProfile?.date_of_birth || '' });
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load your account details.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profileImage) { setProfilePreview(''); return undefined; }
    const previewUrl = URL.createObjectURL(profileImage); setProfilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profileImage]);

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const { data } = await authAPI.updateUser(form);
      setUser(data); localStorage.setItem('user', JSON.stringify(data)); setEditingAccount(false); setNotice('Account information saved.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not save account information.'); }
    finally { setSaving(false); }
  };

  const saveCustomerProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      let data;
      if (profileImage) {
        const payload = new FormData();
        Object.entries(profileForm).forEach(([key, value]) => payload.append(key, value));
        payload.append('image', profileImage);
        const response = customerProfile ? await authAPI.updateProfile(customerProfile.id, payload) : await authAPI.createProfile(payload);
        data = response.data;
      } else if (customerProfile) {
        const response = await authAPI.updateProfile(customerProfile.id, profileForm); data = response.data;
      } else {
        const response = await authAPI.createProfile(profileForm); data = response.data;
      }
      setCustomerProfile(data); setProfileImage(null); setProfileForm({ phone: data.phone || '', gender: data.gender || '', date_of_birth: data.date_of_birth || '' }); setEditingPersonal(false); setNotice('Personal profile saved.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not save your personal profile.'); }
    finally { setSaving(false); }
  };

  const saveAddress = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await authAPI.createAddress(newAddress);
      setNewAddress(emptyAddress); setAddingAddress(false); await loadAddresses(); setNotice('Delivery address added.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not add this address. Check that every field is filled in.'); }
    finally { setSaving(false); }
  };

  const editAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressEditForm({ full_name: address.full_name || '', phone: address.phone || '', address: address.address || '', city: address.city || '', state: address.state || '', pincode: address.pincode || '' });
  };

  const saveEditedAddress = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try { await authAPI.updateAddress(editingAddressId, addressEditForm); await loadAddresses(); setEditingAddressId(null); setNotice('Delivery address updated.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not update this address.'); }
    finally { setSaving(false); }
  };

  const deleteAddress = async (id) => {
    setError(''); setNotice('');
    try { await authAPI.deleteAddress(id); await loadAddresses(); setNotice('Address removed.'); }
    catch (err) { setError(err.response?.data?.detail || 'Could not remove this address.'); }
  };

  if (loading) return <Loading />;

  return (
    <main className="page profile-page">
      <h1>My profile</h1>
      {error && <div className="error" role="alert">{error}</div>}
      {notice && <div className="success" role="status">{notice}</div>}
      <section className="profile-info">
        <div className="profile-section-heading"><div className="profile-avatar-row"><div className="profile-avatar">{(profilePreview || customerProfile?.image) ? <img src={profilePreview || customerProfile.image} alt="Profile" /> : <span>{(user?.first_name || user?.username || 'U').slice(0, 1).toUpperCase()}</span>}</div><div><h2>Personal profile</h2><p>Personal photo and details.</p></div></div>{!editingPersonal && <button type="button" className="admin-quiet-button" onClick={() => setEditingPersonal(true)}>Edit</button>}</div>
        {editingPersonal ? <form className="profile-form" onSubmit={saveCustomerProfile}>
          <label className="profile-image-picker" htmlFor="profile-image">Choose profile photo<input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} /></label>
          <div className="form-group"><label htmlFor="profile-phone">Mobile phone</label><input id="profile-phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div className="profile-name-fields"><div className="form-group"><label htmlFor="profile-gender">Gender</label><select id="profile-gender" value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}><option value="">Prefer not to say</option><option value="Woman">Woman</option><option value="Man">Man</option><option value="Non-binary">Non-binary</option></select></div><div className="form-group"><label htmlFor="profile-birthday">Date of birth</label><input id="profile-birthday" type="date" value={profileForm.date_of_birth || ''} onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} /></div></div>
          <div className="profile-edit-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Save personal profile'}</button><button type="button" className="admin-quiet-button" onClick={() => { setEditingPersonal(false); setProfileImage(null); setProfileForm({ phone: customerProfile?.phone || '', gender: customerProfile?.gender || '', date_of_birth: customerProfile?.date_of_birth || '' }); }}>Cancel</button></div>
        </form> : <div className="profile-readonly"><p><strong>Phone:</strong> {customerProfile?.phone || 'Not added'}</p><p><strong>Gender:</strong> {customerProfile?.gender || 'Not added'}</p><p><strong>Date of birth:</strong> {customerProfile?.date_of_birth || 'Not added'}</p></div>}
      </section>
      <section className="profile-info account-information">
        <div className="profile-section-heading"><div><h2>Account information</h2><p>Login and contact information.</p></div>{!editingAccount && <button type="button" className="admin-quiet-button" onClick={() => setEditingAccount(true)}>Edit</button>}</div>
        {editingAccount ? <form onSubmit={saveProfile} className="profile-form">
          <div className="form-group"><label htmlFor="username">Username</label><input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="profile-name-fields"><div className="form-group"><label htmlFor="first-name">First name</label><input id="first-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div><div className="form-group"><label htmlFor="last-name">Last name</label><input id="last-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div></div>
          <div className="form-group"><label htmlFor="phone">Phone</label><input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label htmlFor="account-address">Default address</label><textarea id="account-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="profile-edit-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Save account'}</button><button type="button" className="admin-quiet-button" onClick={() => { setEditingAccount(false); setForm({ username: user?.username || '', first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '', address: user?.address || '' }); }}>Cancel</button></div>
        </form> : <div className="profile-readonly"><p><strong>Email:</strong> {user?.email}</p><p><strong>Username:</strong> {user?.username}</p><p><strong>Name:</strong> {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Not added'}</p><p><strong>Phone:</strong> {user?.phone || 'Not added'}</p><p><strong>Account type:</strong> {user?.is_staff ? 'Administrator' : 'Customer'}</p></div>}
      </section>
      <section className="addresses">
        <div className="profile-section-heading"><div><h2>Delivery addresses</h2><p>Manage the addresses used at checkout.</p></div><button type="button" className="admin-quiet-button" onClick={() => { setAddingAddress((current) => !current); setEditingAddressId(null); }}>{addingAddress ? 'Cancel' : 'Add address'}</button></div>
        {addresses.length ? <ul>{addresses.map((address) => <li key={address.id}>
          {editingAddressId === address.id ? <form className="address-form" onSubmit={saveEditedAddress}><div className="address-fields">{[['full_name', 'Full name'], ['phone', 'Phone'], ['address', 'Street address'], ['city', 'City'], ['state', 'District / State'], ['pincode', 'Postal code']].map(([key, label]) => <div className="form-group" key={key}><label>{label}</label><input value={addressEditForm[key]} onChange={(event) => setAddressEditForm({ ...addressEditForm, [key]: event.target.value })} required /></div>)}</div><div className="profile-edit-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Save address'}</button><button type="button" className="admin-quiet-button" onClick={() => setEditingAddressId(null)}>Cancel</button></div></form> : <><strong>{address.full_name}</strong><br />{address.address}, {address.city}, {address.state} {address.pincode}<br />Phone: {address.phone}<div className="address-actions"><button type="button" className="admin-quiet-button" onClick={() => editAddress(address)}>Edit</button><button type="button" className="btn-address-delete" onClick={() => deleteAddress(address.id)}>Remove</button></div></>}
        </li>)}</ul> : <p>No saved addresses yet. Add one to place an order.</p>}
        {addingAddress && <form onSubmit={saveAddress} className="address-form"><h3>Add a delivery address</h3><div className="address-fields">{[['full_name', 'Full name'], ['phone', 'Phone'], ['address', 'Street address'], ['city', 'City'], ['state', 'District / State'], ['pincode', 'Postal code']].map(([key, label]) => <div className="form-group" key={key}><label htmlFor={`address-${key}`}>{label}</label><input id={`address-${key}`} value={newAddress[key]} onChange={(event) => setNewAddress({ ...newAddress, [key]: event.target.value })} required /></div>)}</div><div className="profile-edit-actions"><button className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Add address'}</button><button type="button" className="admin-quiet-button" onClick={() => { setAddingAddress(false); setNewAddress(emptyAddress); }}>Cancel</button></div></form>}
      </section>    </main>
  );
};
