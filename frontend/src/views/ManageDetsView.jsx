import React, { useState } from 'react';
import { TacticalMap } from '../components/TacticalMap';

export function ManageDetsView({ dets = [], onSaveDet, onDeleteDet }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDet, setEditingDet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: 28.6139,
    longitude: 77.2090,
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedDet, setSelectedDet] = useState(null);

  const filteredDets = dets.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingDet(null);
    setFormData({
      name: '',
      latitude: 28.6139,
      longitude: 77.2090,
      description: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (det) => {
    setEditingDet(det);
    setFormData({
      name: det.name,
      latitude: det.latitude,
      longitude: det.longitude,
      description: det.description || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Det name is required';
    if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      errs.latitude = 'Latitude must be between -90 and 90';
    }
    if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      errs.longitude = 'Longitude must be between -180 and 180';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSaveDet({
        id: editingDet?.id,
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        description: formData.description.trim(),
      });
      setIsModalOpen(false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapCoordinatePick = (coords) => {
    setFormData((prev) => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
    }));
  };

  return (
    <div className="container-fluid p-4">
      {/* Top Header & Action Controls */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h5 fw-bold text-light m-0">Dets</h2>
          <small className="text-secondary">Register and configure strategic operating dets</small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Search Box */}
          <div className="input-group input-group-sm m-0" style={{ width: '240px' }}>
            <span className="input-group-text bg-dark text-secondary border-secondary">
              <span className="material-symbols-outlined md-16">search</span>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search dets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Det Button */}
          <button
            type="button"
            className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleOpenAdd}
          >
            <span className="material-symbols-outlined md-18">add</span>
            <span>Add Det</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Table & Map Preview */}
      <div className="row g-4">
        {/* Left Col: Dets Table */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm overflow-hidden border-secondary">
            <div className="card-header px-3 py-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined md-18 text-success">format_list_bulleted</span>
                <span className="fw-bold text-light" style={{ fontSize: '13px' }}>Registered Dets</span>
              </div>
              <span className="badge bg-dark border border-secondary text-success font-monospace" style={{ fontSize: '11px' }}>
                {filteredDets.length} Total
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Det Name</th>
                    <th>Coordinates</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-secondary">
                        <span className="material-symbols-outlined md-32 opacity-50 mb-1">radar</span>
                        <p className="m-0 text-light fw-semibold">No Dets Found</p>
                        <small>Click "Add Det" to register a base station.</small>
                      </td>
                    </tr>
                  ) : (
                    filteredDets.map((det) => (
                      <tr
                        key={det.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedDet(det)}
                        className={selectedDet?.id === det.id ? 'table-active' : ''}
                      >
                        <td className="font-monospace text-secondary" style={{ width: '60px' }}>
                          #{det.id}
                        </td>
                        <td>
                          <div className="fw-bold text-light d-flex align-items-center gap-1">
                            <span className="material-symbols-outlined md-16 text-success">radar</span>
                            <span>{det.name}</span>
                          </div>
                        </td>
                        <td className="font-monospace text-warning small">
                          {det.latitude.toFixed(4)}°, {det.longitude.toFixed(4)}°
                        </td>
                        <td className="small text-secondary" style={{ maxWidth: '200px' }}>
                          <span className="text-truncate d-block">
                            {det.description || '—'}
                          </span>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          {deleteConfirmId === det.id ? (
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-danger btn-sm py-0 px-2 fw-bold"
                                style={{ fontSize: '11px' }}
                                onClick={() => {
                                  onDeleteDet(det.id);
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
                                className="btn btn-outline-secondary btn-sm p-1 text-secondary"
                                title="Edit det"
                                onClick={() => handleOpenEdit(det)}
                              >
                                <span className="material-symbols-outlined md-16">edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm p-1 text-danger"
                                title="Delete det"
                                onClick={() => setDeleteConfirmId(det.id)}
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
        </div>

        {/* Right Col: Live Tactical Map Focus */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm h-100 overflow-hidden border-secondary">
            <div className="card-header px-3 py-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined md-18 text-warning">my_location</span>
                <span className="fw-bold text-light" style={{ fontSize: '13px' }}>
                  {selectedDet ? `Station: ${selectedDet.name}` : 'Tactical Station Radar'}
                </span>
              </div>
              {selectedDet && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-0 px-2"
                  style={{ fontSize: '10px' }}
                  onClick={() => setSelectedDet(null)}
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ minHeight: '380px' }}>
              <TacticalMap
                dets={dets}
                selectedDet={selectedDet}
                onSelectDet={(det) => setSelectedDet(det)}
                height="100%"
                interactiveClick={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Det Modal */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg border-secondary">
                <div className="modal-header p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined md-20 text-success">
                      {editingDet ? 'edit_location' : 'add_location'}
                    </span>
                    <h5 className="modal-title fw-bold m-0 text-light" style={{ fontSize: '16px' }}>
                      {editingDet ? 'Edit Det Base' : 'Deploy New Det'}
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
                      <div className="alert alert-danger py-2 px-3 small mb-3">
                        {errors.form}
                      </div>
                    )}

                    <div className="row g-3">
                      {/* Name */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Det Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                          placeholder="e.g. Forward Operating Base Alpha"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                      </div>

                      {/* Coordinates */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Latitude (-90 to 90) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={`form-control font-monospace ${errors.latitude ? 'is-invalid' : ''}`}
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                        />
                        {errors.latitude && <div className="invalid-feedback">{errors.latitude}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Longitude (-180 to 180) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          className={`form-control font-monospace ${errors.longitude ? 'is-invalid' : ''}`}
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                        />
                        {errors.longitude && <div className="invalid-feedback">{errors.longitude}</div>}
                      </div>

                      {/* Interactive Coordinate Picker Map */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary d-flex justify-content-between">
                          <span>Interactive Coordinate Picker</span>
                          <span className="text-warning font-monospace">Click map to set LAT/LNG</span>
                        </label>
                        <div style={{ height: '200px' }}>
                          <TacticalMap
                            dets={dets}
                            onMapClick={handleMapCoordinatePick}
                            interactiveClick={true}
                            height="100%"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary">
                          Description / Sector Notes
                        </label>
                        <textarea
                          rows="2"
                          className="form-control"
                          placeholder="Strategic mission notes, forward commander or staging zone..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
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
                      <span>{isSubmitting ? 'Saving...' : (editingDet ? 'Save Changes' : 'Deploy Base')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
