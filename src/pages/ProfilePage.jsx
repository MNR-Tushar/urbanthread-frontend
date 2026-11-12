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
      setUser(data); localStorage.setItem('user', JSON.stringify(data)); setNotice('Account information saved.');
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
      setCustomerProfile(data); setProfileImage(null); setProfileForm({ phone: data.phone || '', gender: data.gender || '', date_of_birth: data.date_of_birth || '' }); setNotice('Personal profile saved.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not save your personal profile.'); }
    finally { setSaving(false); }
  };

  const saveAddress = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await authAPI.createAddress(newAddress);
      setNewAddress(emptyAddress); await loadAddresses(); setNotice('Delivery address added.');
    } catch (err) { setError(err.response?.data?.detail || 'Could not add this address. Check that every field is filled in.'); }
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
        <div className="profile-avatar-row"><div className="profile-avatar">{(profilePreview || customerProfile?.image) ? <img src={profilePreview || customerProfile.image} alt="Profile" /> : <span>{(user?.first_name || user?.username || 'U').slice(0, 1).toUpperCase()}</span>}</div><div><h2>Personal profile</h2><p>Set your photo and personal details for your account.</p></div></div>
        <form className="profile-form" onSubmit={saveCustomerProfile}>
          <label className="profile-image-picker" htmlFor="profile-image">Choose profile photo<input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} /></label>
          <div className="form-group"><label htmlFor="profile-phone">Mobile phone</label><input id="profile-phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
          <div className="profile-name-fields"><div className="form-group"><label htmlFor="profile-gender">Gender</label><select id="profile-gender" value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}><option value="">Prefer not to say</option><option value="Woman">Woman</option><option value="Man">Man</option><option value="Non-binary">Non-binary</option></select></div><div className="form-group"><label htmlFor="profile-birthday">Date of birth</label><input id="profile-birthday" type="date" value={profileForm.date_of_birth || ''} onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} /></div></div>
          <button className="btn-submit" disabled={saving}>{saving ? 'Saving…' : 'Save personal profile'}</button>
        </form>
      </section>
      <section className="profile-info account-information">
        <h2>Account information</h2>
        <p>Email: {user?.email}</p><p>Account type: {user?.is_staff ? 'Administrator' : 'Customer'}</p>
        <form onSubmit={saveProfile} className="profile-form">
          <div className="form-group"><label htmlFor="username">Username</label><input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="profile-name-fields">
            <div className="form-group"><label htmlFor="first-name">First name</label><input id="first-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div className="form-group"><label htmlFor="last-name">Last name</label><input id="last-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div className="form-group"><label htmlFor="phone">Phone</label><input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label htmlFor="account-address">Default address</label><textarea id="account-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <button className="btn-submit" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</button>
        </form>
      </section>
      <section className="addresses">
        <h2>Delivery addresses</h2>
        {addresses.length ? <ul>{addresses.map((address) => <li key={address.id}>
          <strong>{address.full_name}</strong><br />{address.address}, {address.city}, {address.state} {address.pincode}<br />Phone: {address.phone}
          <button type="button" className="btn-address-delete" onClick={() => deleteAddress(address.id)}>Remove</button>
        </li>)}</ul> : <p>No saved addresses yet. Add one below to place an order.</p>}
        <form onSubmit={saveAddress} className="address-form">
          <h3>Add a delivery address</h3>
          <div className="address-fields">
            {[
              ['full_name', 'Full name'], ['phone', 'Phone'], ['address', 'Street address'],
              ['city', 'City'], ['state', 'District / State'], ['pincode', 'Postal code'],
            ].map(([key, label]) => <div className="form-group" key={key}><label htmlFor={`address-${key}`}>{label}</label>
              <input id={`address-${key}`} value={newAddress[key]} onChange={(event) => setNewAddress({ ...newAddress, [key]: event.target.value })} required />
            </div>)}
          </div>
          <button className="btn-submit" disabled={saving}>{saving ? 'Saving…' : 'Add address'}</button>
        </form>
      </section>
    </main>
  );
};
