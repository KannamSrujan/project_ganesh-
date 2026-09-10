import { useState, useId, useRef } from 'react';
import { LocationPicker } from '../map/LocationPicker';
import { ImageUpload } from './ImageUpload';
import { SubmissionSuccess } from './SubmissionSuccess';
import { submitMandapam } from '../../services/api';

const HYDERABAD_AREAS = [
  'Ameerpet',
  'Banjara Hills',
  'Begumpet',
  'Charminar / Old City',
  'Dilsukhnagar',
  'Gachibowli',
  'Hitec City',
  'Jubilee Hills',
  'Khairatabad',
  'Kondapur',
  'Kothapet',
  'Kukatpally',
  'LB Nagar',
  'Madhapur',
  'Mehdipatnam',
  'Miyapur',
  'Nallakunta',
  'RTC X Roads',
  'Secunderabad',
  'Somajiguda',
  'SR Nagar',
  'Tarnaka',
  'Uppal',
];

interface FormErrors {
  name?: string;
  area?: string;
  location?: string;
  address?: string;
  description?: string;
  image?: string;
}

export function SubmitMandapamForm() {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isSubmittingRef = useRef(false);

  const nameInputId = useId();
  const areaInputId = useId();
  const addressInputId = useId();
  const descInputId = useId();
  const datalistId = useId();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Mandapam name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 120) {
      newErrors.name = 'Name must be 120 characters or fewer.';
    }

    const trimmedArea = area.trim();
    if (!trimmedArea) {
      newErrors.area = 'Area is required.';
    } else if (trimmedArea.length < 2) {
      newErrors.area = 'Area must be at least 2 characters.';
    } else if (trimmedArea.length > 100) {
      newErrors.area = 'Area must be 100 characters or fewer.';
    }

    if (!location) {
      newErrors.location = 'Please pin the mandapam location on the map.';
    } else {
      if (location.lat < -90 || location.lat > 90) {
        newErrors.location = 'Latitude must be between -90 and 90.';
      }
      if (location.lng < -180 || location.lng > 180) {
        newErrors.location = 'Longitude must be between -180 and 180.';
      }
    }

    if (address && address.length > 300) {
      newErrors.address = 'Address must be 300 characters or fewer.';
    }

    if (description && description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or fewer.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    setSubmitError(null);

    if (!validate()) {
      const firstErrorEl = document.querySelector('.form-error');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!location) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('area', area.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      const result = await submitMandapam(formData);

      if (!result.success) {
        setSubmitError(
          result.error ||
            'Unable to submit mandapam. Please check your network and try again.',
        );
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('[SubmitMandapamForm] Submission error:', err);
      setSubmitError(
        'An unexpected error occurred while submitting. Please try again.',
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    isSubmittingRef.current = false;
    setName('');
    setArea('');
    setAddress('');
    setDescription('');
    setLocation(null);
    setImageFile(null);
    setErrors({});
    setSubmitError(null);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return <SubmissionSuccess onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="submit-form" noValidate>
      {submitError && (
        <div className="submit-banner-error" role="alert">
          ⚠️ {submitError}
        </div>
      )}

      {/* 1. Mandapam Name */}
      <div className="form-group">
        <label htmlFor={nameInputId} className="form-label">
          Mandapam Name <span className="form-required">*</span>
        </label>
        <input
          id={nameInputId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g. Khairatabad Ganesh Utsava Samithi"
          maxLength={120}
          className={`form-input ${errors.name ? 'input-error' : ''}`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          required
        />
        {errors.name && (
          <p id="name-error" className="form-error" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* 2. Area */}
      <div className="form-group">
        <label htmlFor={areaInputId} className="form-label">
          Area / Locality <span className="form-required">*</span>
        </label>
        <input
          id={areaInputId}
          type="text"
          list={datalistId}
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            if (errors.area) setErrors((prev) => ({ ...prev, area: undefined }));
          }}
          placeholder="Select or enter area (e.g. Khairatabad, Dilsukhnagar)"
          maxLength={100}
          className={`form-input ${errors.area ? 'input-error' : ''}`}
          aria-invalid={!!errors.area}
          aria-describedby={errors.area ? 'area-error' : undefined}
          required
        />
        <datalist id={datalistId}>
          {HYDERABAD_AREAS.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        <span className="form-hint">
          Choose a suggestion or type any area name in Hyderabad.
        </span>
        {errors.area && (
          <p id="area-error" className="form-error" role="alert">
            {errors.area}
          </p>
        )}
      </div>

      {/* 3. Location Picker */}
      <div className="form-group">
        <label className="form-label">
          Location on Map <span className="form-required">*</span>
        </label>
        <LocationPicker
          selectedLocation={location}
          onLocationSelect={(coords) => {
            setLocation(coords);
            if (errors.location) {
              setErrors((prev) => ({ ...prev, location: undefined }));
            }
          }}
          error={errors.location}
        />
      </div>

      {/* 4. Full Address (optional) */}
      <div className="form-group">
        <label htmlFor={addressInputId} className="form-label">
          Full Address <span className="form-optional">(optional)</span>
        </label>
        <input
          id={addressInputId}
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (errors.address) {
              setErrors((prev) => ({ ...prev, address: undefined }));
            }
          }}
          placeholder="e.g. Near Library, Main Road, Khairatabad"
          maxLength={300}
          className={`form-input ${errors.address ? 'input-error' : ''}`}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? 'address-error' : undefined}
        />
        {errors.address && (
          <p id="address-error" className="form-error" role="alert">
            {errors.address}
          </p>
        )}
      </div>

      {/* 5. Photo (optional) */}
      <div className="form-group">
        <label className="form-label">
          Mandapam Photo <span className="form-optional">(optional)</span>
        </label>
        <ImageUpload
          file={imageFile}
          onFileChange={(f) => {
            setImageFile(f);
            if (errors.image) setErrors((prev) => ({ ...prev, image: undefined }));
          }}
          error={errors.image}
        />
      </div>

      {/* 6. Description (optional) */}
      <div className="form-group">
        <label htmlFor={descInputId} className="form-label">
          About this Mandapam <span className="form-optional">(optional)</span>
        </label>
        <textarea
          id={descInputId}
          rows={3}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          placeholder="Tell visitors a little about this mandapam, theme, or special darshan timings..."
          maxLength={1000}
          className={`form-textarea ${errors.description ? 'input-error' : ''}`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'desc-error' : undefined}
        />
        <div className="form-counter">
          {description.length}/1000 characters
        </div>
        {errors.description && (
          <p id="desc-error" className="form-error" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* 7. Submit Action */}
      <div className="submit-form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-large w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? '⏳ Submitting…' : 'Submit Mandapam'}
        </button>
        <p className="submit-privacy-note">
          Submissions are reviewed by our community team before appearing publicly.
        </p>
      </div>
    </form>
  );
}
