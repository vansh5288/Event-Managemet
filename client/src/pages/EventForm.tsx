import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { eventsApi, venuesApi, uploadApi } from '../lib/api';
import { EventCategories } from '../lib/types';
import PageHeader from '../components/ui/PageHeader';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const emptyForm = {
  title: '',
  shortDescription: '',
  description: '',
  category: 'conference',
  tags: [] as string[],
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  timezone: 'UTC',
  locationType: 'physical',
  address: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  venue: '',
  isVirtual: false,
  virtualLink: '',
  isPrivate: false,
  isRecurring: false,
  recurringPattern: '',
  capacity: 100,
  waitlistCapacity: 0,
  banner: '',
  gallery: [] as string[],
  price: 0,
  currency: 'USD',
  tagsInput: '',
};

export default function EventForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    venuesApi.getAll({ limit: '100' }).then((res: any) => setVenues(res.data || []));
    if (isEdit) {
      setLoading(true);
      eventsApi.getById(id!).then((res: any) => {
        const ev = res.data;
        setForm({
          title: ev.title || '',
          shortDescription: ev.shortDescription || '',
          description: ev.description || '',
          category: ev.category || 'conference',
          tags: ev.tags || [],
          startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '',
          endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '',
          registrationDeadline: ev.registrationDeadline ? new Date(ev.registrationDeadline).toISOString().slice(0, 16) : '',
          timezone: ev.timezone || 'UTC',
          locationType: ev.location?.type || 'physical',
          address: ev.location?.address || '',
          city: ev.location?.city || '',
          state: ev.location?.state || '',
          country: ev.location?.country || '',
          zipCode: ev.location?.zipCode || '',
          venue: typeof ev.venue === 'object' ? ev.venue?._id : ev.venue || '',
          isVirtual: ev.isVirtual || false,
          virtualLink: ev.virtualLink || '',
          isPrivate: ev.isPrivate || false,
          isRecurring: ev.isRecurring || false,
          recurringPattern: ev.recurringPattern || '',
          capacity: ev.capacity || 100,
          waitlistCapacity: ev.waitlistCapacity || 0,
          banner: ev.banner || '',
          gallery: ev.gallery || [],
          price: ev.price || 0,
          currency: ev.currency || 'USD',
          tagsInput: '',
        });
        setLoading(false);
      }).catch((err) => {
        toast.error(err?.message || 'Failed to load event');
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = form.tagsInput.trim().replace(/,/g, '');
    if (tag && !form.tags.includes(tag)) {
      update('tags', [...form.tags, tag]);
    }
    update('tagsInput', '');
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      if (res?.data?.url) {
        update('banner', res.data.url);
        toast.success('Banner uploaded');
      } else if (res?.url) {
        update('banner', res.url);
        toast.success('Banner uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.shortDescription || !form.description || !form.startDate || !form.endDate) {
      toast.error('Please fill required fields (Title, Description, Dates)');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);
    const payload: any = {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      category: form.category,
      tags: form.tags,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : undefined,
      timezone: form.timezone,
      location: {
        type: form.locationType,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        zipCode: form.zipCode,
      },
      venue: form.venue || undefined,
      isVirtual: form.isVirtual,
      virtualLink: form.virtualLink,
      isPrivate: form.isPrivate,
      isRecurring: form.isRecurring,
      recurringPattern: form.recurringPattern,
      capacity: Number(form.capacity),
      waitlistCapacity: Number(form.waitlistCapacity),
      banner: form.banner,
      gallery: form.gallery,
      price: Number(form.price),
      currency: form.currency,
    };

    try {
      let res;
      if (isEdit) {
        res = await eventsApi.update(id!, payload);
        toast.success('Event updated successfully');
      } else {
        res = await eventsApi.create(payload);
        toast.success('Event created successfully');
      }
      navigate(`/dashboard/events/${isEdit ? id : res.data._id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Event' : 'Create Event'}
        subtitle={isEdit ? 'Update your event details' : 'Plan a new event'}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Title *</label>
                    <input className="input-field" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Tech Conference 2025" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Short Description *</label>
                    <input className="input-field" value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} placeholder="Brief summary shown in cards" required maxLength={300} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Description *</label>
                    <textarea className="input-field min-h-[120px]" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Detailed description of the event" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select className="input-field" value={form.category} onChange={(e) => update('category', e.target.value)}>
                        {Object.entries(EventCategories).map(([key, value]) => (
                          <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <div className="flex gap-2">
                        <input className="input-field flex-1" value={form.tagsInput} onChange={(e) => update('tagsInput', e.target.value)} placeholder="Add tag and press Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                        <button type="button" onClick={addTag} className="btn-secondary shrink-0">Add</button>
                      </div>
                      {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.tags.map((tag, i) => (
                            <span key={i} className="badge badge-primary flex items-center gap-1">
                              {tag}
                              <button type="button" onClick={() => update('tags', form.tags.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.isVirtual} onChange={(e) => update('isVirtual', e.target.checked)} className="rounded" />
                      Virtual Event
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.isPrivate} onChange={(e) => update('isPrivate', e.target.checked)} className="rounded" />
                      Private Event
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.isRecurring} onChange={(e) => update('isRecurring', e.target.checked)} className="rounded" />
                      Recurring Event
                    </label>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Start Date *</label><input type="datetime-local" className="input-field" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required /></div>
                  <div><label className="block text-sm font-medium mb-1">End Date *</label><input type="datetime-local" className="input-field" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required /></div>
                  <div><label className="block text-sm font-medium mb-1">Registration Deadline</label><input type="datetime-local" className="input-field" value={form.registrationDeadline} onChange={(e) => update('registrationDeadline', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium mb-1">Timezone</label><select className="input-field" value={form.timezone} onChange={(e) => update('timezone', e.target.value)}><option>UTC</option><option>US/Eastern</option><option>US/Pacific</option><option>Asia/Kolkata</option><option>Europe/London</option></select></div>
                </div>
              </motion.div>

              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Location & Venue</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Venue</label>
                    <select className="input-field" value={form.venue} onChange={(e) => update('venue', e.target.value)}>
                      <option value="">Select a venue</option>
                      {venues.map((v) => <option key={v._id} value={v._id}>{v.name} – {v.city}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Location Type</label><select className="input-field" value={form.locationType} onChange={(e) => update('locationType', e.target.value)}><option value="physical">Physical</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Virtual Link {form.isVirtual && <span className="text-red-500">*</span>}</label><input className="input-field" value={form.virtualLink} onChange={(e) => update('virtualLink', e.target.value)} placeholder="https://zoom.us/..." /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Address</label><input className="input-field" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street address" /></div>
                    <div><label className="block text-sm font-medium mb-1">City</label><input className="input-field" value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
                    <div><label className="block text-sm font-medium mb-1">State</label><input className="input-field" value={form.state} onChange={(e) => update('state', e.target.value)} /></div>
                    <div><label className="block text-sm font-medium mb-1">Country</label><input className="input-field" value={form.country} onChange={(e) => update('country', e.target.value)} /></div>
                    <div><label className="block text-sm font-medium mb-1">Zip Code</label><input className="input-field" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} /></div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Capacity & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Capacity *</label><input type="number" min={1} className="input-field" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} required /></div>
                  <div><label className="block text-sm font-medium mb-1">Waitlist Capacity</label><input type="number" min={0} className="input-field" value={form.waitlistCapacity} onChange={(e) => update('waitlistCapacity', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium mb-1">Base Price</label><input type="number" min={0} className="input-field" value={form.price} onChange={(e) => update('price', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium mb-1">Currency</label><select className="input-field" value={form.currency} onChange={(e) => update('currency', e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option></select></div>
                </div>
              </motion.div>
            </div>

            {/* Side column */}
            <div className="space-y-6">
              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Banner Image</h3>
                {form.banner ? (
                  <div className="relative rounded-xl overflow-hidden mb-3">
                    <img src={form.banner} alt="Banner" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => update('banner', '')} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <p className="text-sm text-gray-400">{uploading ? 'Uploading...' : 'Click to upload banner'}</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                  </label>
                )}
              </motion.div>

              <motion.div variants={item} className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium capitalize">{form.category}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium">{form.capacity || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-medium">{form.currency} {form.price || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium capitalize">{form.locationType}</span></div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </motion.div>
  );
}

