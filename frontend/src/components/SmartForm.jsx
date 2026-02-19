import React from 'react';
import { useInteractionStore } from '../stores/interactionStore';

const SmartForm = () => {
    const { formData, setFormData } = useInteractionStore();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('¡Formulario enviado con éxito!');
    };

    return (
        <form onSubmit={handleSubmit} className="needs-validation">
            {/* Name Field */}
            <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase text-muted mb-2"
                    style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    Full Name
                </label>
                <div className="position-relative">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-control border-0 border-bottom rounded-0 px-0 py-2 bg-transparent shadow-none"
                        placeholder="e.g. John Doe"
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            borderColor: 'var(--border-color) !important',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                </div>
            </div>

            {/* Email Field */}
            <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase text-muted mb-2"
                    style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    Email Address
                </label>
                <div className="position-relative">
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control border-0 border-bottom rounded-0 px-0 py-2 bg-transparent shadow-none"
                        placeholder="john@example.com"
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            borderColor: 'var(--border-color) !important',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                </div>
            </div>

            {/* Comments Field */}
            <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase text-muted mb-2"
                    style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    Additional Comments
                </label>
                <div className="position-relative">
                    <textarea
                        name="comments"
                        value={formData.comments}
                        onChange={handleChange}
                        rows="3"
                        className="form-control border-0 border-bottom rounded-0 px-0 py-2 bg-transparent shadow-none"
                        placeholder="Any specific requests..."
                        style={{
                            fontSize: '1rem',
                            fontWeight: '400',
                            borderColor: 'var(--border-color) !important',
                            transition: 'all 0.3s ease',
                            resize: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
                <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 fw-bold rounded-3 position-relative overflow-hidden"
                    style={{
                        fontSize: '1rem',
                        letterSpacing: '0.5px',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    <span className="position-relative" style={{ zIndex: 1 }}>
                        Sign Up Now
                    </span>
                </button>
                <p className="text-center text-muted mt-3 mb-0 small">
                    Already have an account?{' '}
                    <a href="#" className="text-decoration-none fw-semibold"
                        style={{ color: 'var(--primary)' }}>
                        Log in
                    </a>
                </p>
            </div>
        </form>
    );
};

export default SmartForm;
