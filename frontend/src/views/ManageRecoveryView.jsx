import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { TacticalMap } from '../components/TacticalMap';

export const CASUALTY_CATEGORIES = [
  { key: 'Generator', label: 'Generator', short: 'Genr', icon: 'bolt' },
  { key: 'Heavy Vehicle', label: 'Heavy Vehicle', short: 'Hy Veh', icon: 'local_shipping' },
  { key: 'Light Vehicle', label: 'Light Vehicle', short: 'Lt Veh', icon: 'directions_car' },
  { key: 'Miscellaneous', label: 'Miscellaneous', short: 'Misc', icon: 'category' },
  { key: 'Special Vehicle', label: 'Special Vehicle', short: 'Spl Veh', icon: 'precision_manufacturing' },
  { key: 'Engineering Equipment', label: 'Engineering Equipment', short: 'Engr Eqpt', icon: 'construction' },
];

export function ManageRecoveryView({
  recoveries = [],
  dets = [],
  vehicles = [],
  onSaveRecovery,
  onDeleteRecovery,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDetId, setFilterDetId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCasualty, setFilterCasualty] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecovery, setEditingRecovery] = useState(null);
  const [activePickerTarget, setActivePickerTarget] = useState('from'); // 'from' | 'to'

  // Route Map Visualizer Modal State
  const [routeViewingRecovery, setRouteViewingRecovery] = useState(null);

  // Form State with multi-vehicle assignment & equipment name (No equipment_type)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time_taken_recovery: 1.5,
    det_id: '',
    description: '',
    casualty_type: 'Heavy Vehicle',
    cas_vehicle_equipment_name: '2.5 Ton Truck',
    from_lat: 28.6139,
    from_lng: 77.2090,
    from_place_description: '',
    to_lat: 28.6139,
    to_lng: 77.2090,
    to_place_description: '',
    effectiveness_index: 95.0,
    call_received_time: '10:00',
    time_to_reach: 0.5,
    status: 'Active',
    vehicle_ids: [],
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Filtered List
  const filteredRecoveries = recoveries.filter((r) => {
    const matchDet = filterDetId === 'all' || r.det_id === parseInt(filterDetId);
    const matchStatus = filterStatus === 'all' || r.status.toLowerCase() === filterStatus.toLowerCase();
    const matchCasualty = filterCasualty === 'all' || r.casualty_type.toLowerCase() === filterCasualty.toLowerCase();

    const detName = r.det?.name || '';
    const desc = r.description || '';
    const fromDesc = r.from_place_description || '';
    const toDesc = r.to_place_description || '';
    const cas = r.casualty_type || '';
    const casName = r.cas_vehicle_equipment_name || '';

    const matchSearch =
      detName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      casName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchDet && matchStatus && matchCasualty && matchSearch;
  });

  // Available tactical vehicles stationed at the currently selected Det in the form
  const availableDetVehicles = vehicles.filter(
    (v) => v.det_id === parseInt(formData.det_id)
  );

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingRecovery(null);
    const defaultDet = dets[0] || { id: '', latitude: 28.6139, longitude: 77.2090, name: '' };
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time_taken_recovery: 2.0,
      det_id: defaultDet.id,
      description: '',
      casualty_type: 'Heavy Vehicle',
      cas_vehicle_equipment_name: '2.5 Ton Truck',
      from_lat: defaultDet.latitude || 28.6139,
      from_lng: defaultDet.longitude || 77.2090,
      from_place_description: 'Incident Grid Point Alpha',
      to_lat: defaultDet.latitude || 28.6139,
      to_lng: defaultDet.longitude || 77.2090,
      to_place_description: defaultDet.name || 'Station Workshop Bay',
      effectiveness_index: 95.0,
      call_received_time: '10:30',
      time_to_reach: 0.5,
      status: 'Active',
      vehicle_ids: [],
    });
    setActivePickerTarget('from');
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec) => {
    setEditingRecovery(rec);
    const assignedIds = (rec.vehicles || []).map((v) => v.id);
    setFormData({
      date: rec.date,
      time_taken_recovery: rec.time_taken_recovery,
      det_id: rec.det_id,
      description: rec.description || '',
      casualty_type: rec.casualty_type || 'Heavy Vehicle',
      cas_vehicle_equipment_name: rec.cas_vehicle_equipment_name || '',
      from_lat: rec.from_lat,
      from_lng: rec.from_lng,
      from_place_description: rec.from_place_description || '',
      to_lat: rec.to_lat,
      to_lng: rec.to_lng,
      to_place_description: rec.to_place_description || '',
      effectiveness_index: rec.effectiveness_index ?? 90.0,
      call_received_time: rec.call_received_time || '',
      time_to_reach: rec.time_to_reach ?? 0.5,
      status: rec.status || 'Completed',
      vehicle_ids: assignedIds,
    });
    setActivePickerTarget('from');
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.det_id) errs.det_id = 'Please select a responsible Det';
    if (!formData.casualty_type) errs.casualty_type = 'Casualty type is required';
    if (isNaN(formData.from_lat) || isNaN(formData.from_lng)) errs.from_coords = 'Origin coordinates required';
    if (isNaN(formData.to_lat) || isNaN(formData.to_lng)) errs.to_coords = 'Destination coordinates required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSaveRecovery({
        id: editingRecovery?.id,
        date: formData.date,
        time_taken_recovery: parseFloat(formData.time_taken_recovery) || 0,
        det_id: parseInt(formData.det_id),
        description: formData.description?.trim() || '',
        casualty_type: formData.casualty_type,
        cas_vehicle_equipment_name: formData.cas_vehicle_equipment_name?.trim() || '',
        from_lat: parseFloat(formData.from_lat),
        from_lng: parseFloat(formData.from_lng),
        from_place_description: formData.from_place_description?.trim() || '',
        to_lat: parseFloat(formData.to_lat),
        to_lng: parseFloat(formData.to_lng),
        to_place_description: formData.to_place_description?.trim() || '',
        effectiveness_index: parseFloat(formData.effectiveness_index) || 0,
        call_received_time: formData.call_received_time || '',
        time_to_reach: parseFloat(formData.time_to_reach) || 0,
        status: formData.status,
        vehicle_ids: formData.vehicle_ids,
      });
      setIsModalOpen(false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map coordinate picking
  const handleMapCoordinatePick = (coords) => {
    if (activePickerTarget === 'from') {
      setFormData((prev) => ({
        ...prev,
        from_lat: coords.lat,
        from_lng: coords.lng,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        to_lat: coords.lat,
        to_lng: coords.lng,
      }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success-subtle text-success border border-success';
      case 'active':
        return 'bg-warning-subtle text-warning border border-warning';
      case 'abort':
      case 'aborted':
        return 'bg-danger-subtle text-danger border border-danger';
      default:
        return 'bg-secondary text-light';
    }
  };

  // Route map Leaflet effect for modal
  useEffect(() => {
    if (!routeViewingRecovery) return;

    const container = document.getElementById('route-map-container');
    if (!container) return;

    const map = L.map(container, {
      center: [(routeViewingRecovery.from_lat + routeViewingRecovery.to_lat) / 2, (routeViewingRecovery.from_lng + routeViewingRecovery.to_lng) / 2],
      zoom: 11,
      minZoom: 2,
      maxZoom: 18,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Origin Marker (Casualty Site)
    const originIcon = L.divIcon({
      className: 'custom-route-marker',
      html: `<div style="background:#ef4444; color:#fff; border:2px solid #fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.5);"><span class="material-symbols-outlined" style="font-size:18px;">crisis_alert</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const destIcon = L.divIcon({
      className: 'custom-route-marker',
      html: `<div style="background:#556b2f; color:#fff; border:2px solid #fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.5);"><span class="material-symbols-outlined" style="font-size:18px;">build_circle</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([routeViewingRecovery.from_lat, routeViewingRecovery.from_lng], { icon: originIcon })
      .bindPopup(`<b>Casualty Site (From)</b><br/>${routeViewingRecovery.from_place_description || ''}`)
      .addTo(map);

    L.marker([routeViewingRecovery.to_lat, routeViewingRecovery.to_lng], { icon: destIcon })
      .bindPopup(`<b>Destination Depot (To)</b><br/>${routeViewingRecovery.to_place_description || ''}`)
      .addTo(map);

    // Transit Polyline
    const latlngs = [
      [routeViewingRecovery.from_lat, routeViewingRecovery.from_lng],
      [routeViewingRecovery.to_lat, routeViewingRecovery.to_lng],
    ];
    const polyline = L.polyline(latlngs, { color: '#eab308', weight: 4, dashArray: '6, 8' }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    return () => {
      map.remove();
    };
  }, [routeViewingRecovery]);

  return (
    <div className="container-fluid p-4">
      {/* Header & Controls */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h5 fw-bold text-light m-0">Recovery Operations</h2>
          <small className="text-secondary">Track vehicle recovery activities, casualty extractions, and multi-vehicle assignments</small>
        </div>

        <button
          type="button"
          className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
          onClick={handleOpenAdd}
        >
          <span className="material-symbols-outlined md-18">add</span>
          <span>Log Recovery Activity</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-4 border-secondary">
        <div className="card-header px-3 py-2 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
            {/* Det Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: '160px' }}
              value={filterDetId}
              onChange={(e) => setFilterDetId(e.target.value)}
            >
              <option value="all">All Dets</option>
              {dets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter (Strict 3 Statuses: Active, Abort, Completed) */}
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="abort">Abort</option>
              <option value="completed">Completed</option>
            </select>

            {/* Casualty Type Filter (Strict 6 Categories) */}
            <select
              className="form-select form-select-sm"
              style={{ width: '190px' }}
              value={filterCasualty}
              onChange={(e) => setFilterCasualty(e.target.value)}
            >
              <option value="all">All Casualty Types</option>
              {CASUALTY_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label} ({cat.short})
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="input-group input-group-sm m-0" style={{ width: '220px' }}>
              <span className="input-group-text bg-dark text-secondary border-secondary">
                <span className="material-symbols-outlined md-16">search</span>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search recovery mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <span className="badge bg-dark border border-secondary text-success font-monospace" style={{ fontSize: '11px' }}>
            {filteredRecoveries.length} Records
          </span>
        </div>

        {/* Recovery Operations Table */}
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date & Time</th>
                <th>Bn / Det</th>
                <th>Cas Type</th>
                <th>Cas Veh/Eqpt Name</th>
                <th>Assigned Recovery Fleet</th>
                <th>Route (From ➔ To)</th>
                <th>Reach / Total</th>
                <th>Effectiveness</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecoveries.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-5 text-secondary">
                    <span className="material-symbols-outlined md-32 opacity-50 mb-1">build_circle</span>
                    <p className="m-0 text-light fw-semibold">No Recovery Activities Found</p>
                    <small>Click "Log Recovery Activity" to record vehicle extractions.</small>
                  </td>
                </tr>
              ) : (
                filteredRecoveries.map((r) => (
                  <tr key={r.id}>
                    <td className="font-monospace text-secondary fw-bold" style={{ width: '70px' }}>
                      REC #{r.id}
                    </td>
                    <td>
                      <div className="fw-semibold text-light">{r.date}</div>
                      {r.call_received_time && (
                        <small className="text-secondary font-monospace" style={{ fontSize: '10px' }}>
                          Call: {r.call_received_time}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary text-light">
                        {r.det?.name || `DET #${r.det_id}`}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-light fw-semibold">
                        <span className="material-symbols-outlined md-16 text-warning">
                          {CASUALTY_CATEGORIES.find((c) => c.key === r.casualty_type)?.icon || 'warning'}
                        </span>
                        <span>{r.casualty_type}</span>
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-light font-monospace small">
                        {r.cas_vehicle_equipment_name || '—'}
                      </div>
                    </td>
                    <td>
                      {r.vehicles && r.vehicles.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {r.vehicles.map((v) => (
                            <span
                              key={v.id}
                              className="badge bg-dark border border-secondary text-success font-monospace"
                              style={{ fontSize: '10px' }}
                            >
                              {v.model?.name || `Veh #${v.id}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <small className="text-secondary italic">Standard ARV</small>
                      )}
                    </td>
                    <td>
                      <div className="small text-truncate" style={{ maxWidth: '180px' }}>
                        <span className="text-danger">● From:</span> {r.from_place_description || `${r.from_lat.toFixed(2)}°, ${r.from_lng.toFixed(2)}°`}
                      </div>
                      <div className="small text-truncate" style={{ maxWidth: '180px' }}>
                        <span className="text-success">● To:</span> {r.to_place_description || `${r.to_lat.toFixed(2)}°, ${r.to_lng.toFixed(2)}°`}
                      </div>
                    </td>
                    <td className="font-monospace text-light small">
                      <div>Reach: {r.time_to_reach}h</div>
                      <div className="text-secondary">Total: {r.time_taken_recovery}h</div>
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-warning font-monospace">
                        {r.effectiveness_index}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-end">
                      {deleteConfirmId === r.id ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm py-0 px-2 fw-bold"
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              onDeleteRecovery(r.id);
                              setDeleteConfirmId(null);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            style={{ fontSize: '11px' }}
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1 text-warning"
                            title="View Route Map"
                            onClick={() => setRouteViewingRecovery(r)}
                          >
                            <span className="material-symbols-outlined md-16">map</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1 text-secondary"
                            title="Edit recovery"
                            onClick={() => handleOpenEdit(r)}
                          >
                            <span className="material-symbols-outlined md-16">edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm p-1 text-danger"
                            title="Delete recovery"
                            onClick={() => setDeleteConfirmId(r.id)}
                          >
                            <span className="material-symbols-outlined md-16">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Recovery Activity Modal with Dual Interactive Map Coordinate Picker */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow-lg border-secondary">
                <div className="modal-header p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined md-20 text-success">
                      {editingRecovery ? 'edit' : 'add_task'}
                    </span>
                    <h5 className="modal-title fw-bold m-0 text-light" style={{ fontSize: '16px' }}>
                      {editingRecovery ? 'Edit Recovery Activity' : 'Log New Recovery Activity'}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <span className="material-symbols-outlined md-18">close</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    {errors.form && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">{errors.form}</div>
                    )}

                    <div className="row g-4">
                      {/* Left Sub-Column: General & Mission Details */}
                      <div className="col-12 col-lg-6">
                        <h6 className="fw-bold text-success small mb-3 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                          1. Activity Specifications & Detachment
                        </h6>

                        <div className="row g-3">
                          {/* 1. Date */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Date of Activity <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                          </div>

                          {/* 10. Call Received Time */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Call Received Time
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              value={formData.call_received_time}
                              onChange={(e) => setFormData({ ...formData, call_received_time: e.target.value })}
                            />
                          </div>

                          {/* 3. Det */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Responsible Det <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.det_id ? 'is-invalid' : ''}`}
                              value={formData.det_id}
                              onChange={(e) => {
                                const newDetId = e.target.value;
                                const chosenDet = dets.find((d) => String(d.id) === String(newDetId));
                                setFormData((prev) => ({
                                  ...prev,
                                  det_id: newDetId,
                                  vehicle_ids: [], // reset assigned vehicles when det changes
                                  to_lat: chosenDet ? chosenDet.latitude : prev.to_lat,
                                  to_lng: chosenDet ? chosenDet.longitude : prev.to_lng,
                                  to_place_description: chosenDet ? `${chosenDet.name} Station Workshop Bay` : prev.to_place_description,
                                }));
                              }}
                            >
                              <option value="">Select Det</option>
                              {dets.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 5. Activity Performed (Casualty Type: Strict 6 Categories) */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Casualty Type <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              value={formData.casualty_type}
                              onChange={(e) => setFormData({ ...formData, casualty_type: e.target.value })}
                            >
                              {CASUALTY_CATEGORIES.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                  {cat.label} ({cat.short})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Casualty Vehicle / Equipment Name */}
                          <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">
                              Cas Veh/Eqpt (Name) <span className="text-secondary small">(e.g. 30 KVA Genr, 2.5 Ton Truck)</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. 30 KVA Genr, 2.5 Ton Truck"
                              value={formData.cas_vehicle_equipment_name}
                              onChange={(e) => setFormData({ ...formData, cas_vehicle_equipment_name: e.target.value })}
                            />
                          </div>

                          {/* Multi-Vehicle Assignment from Selected Detachment */}
                          <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                              <span>Assigned Vehicles in Recovery (from selected Det)</span>
                              <span className="badge bg-dark border border-secondary text-warning font-monospace">
                                {formData.vehicle_ids.length} Selected
                              </span>
                            </label>
                            <div className="border border-secondary rounded p-2 bg-dark">
                              {availableDetVehicles.length === 0 ? (
                                <small className="text-secondary d-block py-1">
                                  No tactical vehicles stationed at this Det. (You can register vehicles in Manage Vehicles menu).
                                </small>
                              ) : (
                                <div className="d-flex flex-wrap gap-2">
                                  {availableDetVehicles.map((v) => {
                                    const isSelected = formData.vehicle_ids.includes(v.id);
                                    return (
                                      <button
                                        type="button"
                                        key={v.id}
                                        className={`btn btn-sm d-flex align-items-center gap-1 ${isSelected ? 'btn-success' : 'btn-outline-secondary'
                                          }`}
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            vehicle_ids: isSelected
                                              ? prev.vehicle_ids.filter((id) => id !== v.id)
                                              : [...prev.vehicle_ids, v.id],
                                          }));
                                        }}
                                      >
                                        <span className="material-symbols-outlined md-14">
                                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <span>{v.model?.name || `Veh #${v.id}`}</span>
                                        <span className="badge bg-black bg-opacity-30 text-light py-0 px-1 font-monospace" style={{ fontSize: '10px' }}>
                                          #{v.id}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 12. Recovery Status (Strict 3: Active, Abort, Completed) */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Recovery Status
                            </label>
                            <select
                              className="form-select"
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                              <option value="Active">Active</option>
                              <option value="Abort">Abort</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>

                          {/* 11. Time Taken to Reach */}
                          <div className="col-md-3">
                            <label className="form-label small fw-semibold text-secondary">
                              Time to Reach (h)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control font-monospace"
                              value={formData.time_to_reach}
                              onChange={(e) => setFormData({ ...formData, time_to_reach: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          {/* 2. Time Taken to Complete Recovery */}
                          <div className="col-md-3">
                            <label className="form-label small fw-semibold text-secondary">
                              Recovery Time (h)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              className="form-control font-monospace"
                              value={formData.time_taken_recovery}
                              onChange={(e) => setFormData({ ...formData, time_taken_recovery: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          {/* 9. Recovery Effectiveness Index */}
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">
                              Effectiveness Index (%)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              className="form-control font-monospace"
                              value={formData.effectiveness_index}
                              onChange={(e) => setFormData({ ...formData, effectiveness_index: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          {/* 4. Description */}
                          <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">
                              Mission / Incident Description
                            </label>
                            <textarea
                              rows="2"
                              className="form-control"
                              placeholder="Describe casualty context, terrain conditions, and extraction actions..."
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      {/* Right Sub-Column: Origin & Destination Coordinates with Map Picker */}
                      <div className="col-12 col-lg-6">
                        <h6 className="fw-bold text-success small mb-3 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                          2. Route Geolocation (Origin & Destination)
                        </h6>

                        {/* Interactive Picker Selector Buttons */}
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <button
                            type="button"
                            className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 ${activePickerTarget === 'from' ? 'btn-danger' : 'btn-outline-secondary'
                              }`}
                            onClick={() => setActivePickerTarget('from')}
                          >
                            <span className="material-symbols-outlined md-16">pin_drop</span>
                            <span>Click Map: <strong>From Place (Origin)</strong></span>
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 ${activePickerTarget === 'to' ? 'btn-success' : 'btn-outline-secondary'
                              }`}
                            onClick={() => setActivePickerTarget('to')}
                          >
                            <span className="material-symbols-outlined md-16">where_to_vote</span>
                            <span>Click Map: <strong>To Place (Destination)</strong></span>
                          </button>
                        </div>

                        {/* Map Picker View with All Dets & Auto-Focus on Selected Det */}
                        <div className="rounded overflow-hidden border border-secondary mb-3" style={{ height: '220px' }}>
                          <TacticalMap
                            dets={dets}
                            selectedDet={dets.find((d) => String(d.id) === String(formData.det_id)) || null}
                            onSelectDet={(det) => {
                              setFormData((prev) => ({
                                ...prev,
                                det_id: det.id,
                                vehicle_ids: [],
                                to_lat: det.latitude,
                                to_lng: det.longitude,
                                to_place_description: `${det.name} Station Workshop Bay`,
                              }));
                            }}
                            onMapClick={handleMapCoordinatePick}
                            interactiveClick={true}
                            height="100%"
                          />
                        </div>

                        {/* 6. From Place Details */}
                        <div className="row g-2 mb-2 p-2 rounded bg-dark border border-secondary">
                          <div className="col-12">
                            <span className="badge bg-danger-subtle text-danger small mb-1">From Place (Casualty Origin)</span>
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="From place description (e.g. Mud Basin Grid 4)"
                              value={formData.from_place_description}
                              onChange={(e) => setFormData({ ...formData, from_place_description: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3">
                            <input
                              type="number"
                              step="any"
                              className="form-control form-control-sm font-monospace"
                              placeholder="LAT"
                              value={formData.from_lat}
                              onChange={(e) => setFormData({ ...formData, from_lat: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="col-md-3">
                            <input
                              type="number"
                              step="any"
                              className="form-control form-control-sm font-monospace"
                              placeholder="LNG"
                              value={formData.from_lng}
                              onChange={(e) => setFormData({ ...formData, from_lng: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>

                        {/* 7. To Place Details */}
                        <div className="row g-2 p-2 rounded bg-dark border border-secondary">
                          <div className="col-12">
                            <span className="badge bg-success-subtle text-success small mb-1">To Place (Depot / Safe Base)</span>
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="To place description (e.g. FOB Echo Workshop)"
                              value={formData.to_place_description}
                              onChange={(e) => setFormData({ ...formData, to_place_description: e.target.value })}
                            />
                          </div>
                          <div className="col-md-3">
                            <input
                              type="number"
                              step="any"
                              className="form-control form-control-sm font-monospace"
                              placeholder="LAT"
                              value={formData.to_lat}
                              onChange={(e) => setFormData({ ...formData, to_lat: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="col-md-3">
                            <input
                              type="number"
                              step="any"
                              className="form-control form-control-sm font-monospace"
                              placeholder="LNG"
                              value={formData.to_lng}
                              onChange={(e) => setFormData({ ...formData, to_lng: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer p-3 border-top border-secondary">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-success btn-sm px-4 d-flex align-items-center gap-1"
                    >
                      <span className="material-symbols-outlined md-16">check</span>
                      <span>{isSubmitting ? 'Saving...' : (editingRecovery ? 'Save Changes' : 'Log Recovery Mission')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mission Route Map Visualizer Modal */}
      {routeViewingRecovery && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg border-secondary">
                <div className="modal-header p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined md-20 text-warning">route</span>
                    <h5 className="modal-title fw-bold m-0 text-light" style={{ fontSize: '16px' }}>
                      Recovery Mission Route: REC #{routeViewingRecovery.id} ({routeViewingRecovery.casualty_type})
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1"
                    onClick={() => setRouteViewingRecovery(null)}
                  >
                    <span className="material-symbols-outlined md-18">close</span>
                  </button>
                </div>

                <div className="modal-body p-0">
                  <div id="route-map-container" style={{ height: '380px', width: '100%' }}></div>

                  <div className="p-3 bg-dark border-top border-secondary">
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <div className="small text-danger fw-bold">● Origin (Casualty Place):</div>
                        <div className="small text-light">{routeViewingRecovery.from_place_description || 'Coordinates Marked'}</div>
                        <div className="font-monospace text-secondary" style={{ fontSize: '11px' }}>
                          LAT: {routeViewingRecovery.from_lat.toFixed(4)}° | LNG: {routeViewingRecovery.from_lng.toFixed(4)}°
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="small text-success fw-bold">● Destination (Base Depot):</div>
                        <div className="small text-light">{routeViewingRecovery.to_place_description || 'Coordinates Marked'}</div>
                        <div className="font-monospace text-secondary" style={{ fontSize: '11px' }}>
                          LAT: {routeViewingRecovery.to_lat.toFixed(4)}° | LNG: {routeViewingRecovery.to_lng.toFixed(4)}°
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer p-3 border-top border-secondary">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => setRouteViewingRecovery(null)}
                  >
                    Close Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ManageRecoveryView;
