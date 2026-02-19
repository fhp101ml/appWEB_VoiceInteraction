import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../api/client';
import { useInteractionStore } from '../stores/interactionStore';
import { Plus, Trash2, Edit2, Package, MapPin, Filter } from 'lucide-react';
import { Modal, Button, Form } from 'react-bootstrap';

const CATEGORIAS = ['alimentacion', 'juguetes', 'accesorios', 'salud', 'higiene', 'otros'];

const ProductsManager = () => {
    const queryClient = useQueryClient();
    const [filterCategory, setFilterCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'alimentacion',
        ubicacion: '',
        cantidad: 1
    });

    // Queries
    const { data: products, isLoading, isError } = useQuery({
        queryKey: ['products', filterCategory],
        queryFn: () => productsAPI.list(filterCategory ? { categoria: filterCategory } : {}).then(res => res.data),
    });

    // Interaction Store for Voice Form Filling
    const { formData: agentFormData } = useInteractionStore();

    // Real-time Updates & Event Listeners
    React.useEffect(() => {
        const handleUpdates = () => {
            queryClient.invalidateQueries(['products']);
            console.log('🔄 Actualizando lista de productos...');
        };

        const handleOpenForm = () => {
            handleShow();
            console.log('📝 Abriendo formulario por voz...');
        };

        const handleCloseForm = () => {
            handleClose();
            console.log('❌ Cerrando formulario por voz...');
        };

        // Escuchar eventos tanto de productos como los genéricos antiguos por si acaso
        window.addEventListener('products_updated', handleUpdates);
        window.addEventListener('open_product_form', handleOpenForm);
        window.addEventListener('close_product_form', handleCloseForm);

        return () => {
            window.removeEventListener('products_updated', handleUpdates);
            window.removeEventListener('open_product_form', handleOpenForm);
            window.removeEventListener('close_product_form', handleCloseForm);
        };
    }, [queryClient]);

    // Sync Form with Voice Agent
    React.useEffect(() => {
        if (showModal && agentFormData) {
            setFormData(prev => ({
                ...prev,
                ...Object.fromEntries(
                    Object.entries(agentFormData).filter(([_, v]) => v !== undefined && v !== '')
                )
            }));
        }
    }, [agentFormData, showModal]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: productsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            handleClose();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => productsAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            handleClose();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: productsAPI.delete,
        onSuccess: () => queryClient.invalidateQueries(['products']),
    });

    // Handlers
    const handleClose = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            nombre: '',
            descripcion: '',
            categoria: 'alimentacion',
            ubicacion: '',
            cantidad: 1
        });
        useInteractionStore.setState(state => ({ ...state, formData: {} }));
    };

    const handleShow = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                nombre: product.nombre,
                descripcion: product.descripcion || '',
                categoria: product.categoria,
                ubicacion: product.ubicacion,
                cantidad: product.cantidad
            });
        } else {
            useInteractionStore.setState(state => ({ ...state, formData: {} }));
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h3 fw-bold gradient-text">Inventario de Tienda de Mascotas</h2>
                    <p className="text-muted small mb-0">Gestión de productos y stock</p>
                </div>
                <button
                    onClick={() => handleShow()}
                    className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm"
                >
                    <Plus size={18} /> Nuevo Producto
                </button>
            </div>

            {/* Filters */}
            <div className="glass-effect p-3 rounded-4 mb-4 shadow-sm d-flex align-items-center gap-3">
                <Filter size={18} className="text-muted" />
                <span className="fw-semibold small text-muted text-uppercase">Filtrar por categoría:</span>
                <select
                    className="form-select border-0 bg-transparent fw-semibold text-primary w-auto"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="">Todas</option>
                    {CATEGORIAS.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                </select>
            </div>

            {isLoading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            )}

            {isError && (
                <div className="alert alert-danger rounded-4 shadow-sm">
                    Error al cargar los productos. Por favor, intenta de nuevo.
                </div>
            )}

            <div className="row g-4">
                {products?.map((product) => (
                    <div key={product.id} className="col-md-6 col-lg-4 col-xl-3 animate-fade-in-up">
                        <div className="card h-100 border-0 glass-effect hover-lift">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="badge rounded-pill px-3 py-2 text-uppercase"
                                        style={{
                                            background: `var(--gradient-${getCategoryColor(product.categoria)})`,
                                            color: 'white',
                                            fontSize: '0.7rem'
                                        }}>
                                        {product.categoria}
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn btn-link text-muted p-0" onClick={() => handleShow(product)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn btn-link text-danger p-0 ms-2" onClick={() => handleDelete(product.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h5 className="card-title fw-bold mb-1">{product.nombre}</h5>
                                <p className="text-muted small mb-3 text-truncate">{product.descripcion || 'Sin descripción'}</p>

                                <div className="d-flex flex-column gap-2 mb-3">
                                    <div className="d-flex align-items-center gap-2 text-secondary small">
                                        <MapPin size={14} />
                                        <span>{product.ubicacion}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-secondary small">
                                        <Package size={14} />
                                        <span>Stock: <strong>{product.cantidad}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer bg-transparent border-0 p-3 pt-0">
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Reg: {new Date(product.fecha_registro).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products?.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <Package size={48} className="mb-3 opacity-25" />
                    <p>No se encontraron productos.</p>
                </div>
            )}

            <Modal show={showModal} onHide={handleClose} centered backdrop="static" enforceFocus={false}>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold h5">
                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                                className="shadow-none"
                            />
                        </Form.Group>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold text-muted text-uppercase">Categoría</Form.Label>
                                <Form.Select
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                    className="shadow-none"
                                >
                                    {CATEGORIAS.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label className="small fw-bold text-muted text-uppercase">Cantidad</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                                    required
                                    className="shadow-none"
                                />
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Ubicación</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.ubicacion}
                                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                required
                                className="shadow-none"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted text-uppercase">Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="shadow-none"
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button variant="primary" type="submit" className="py-2 fw-bold shadow-sm">
                                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

// Helper for category colors
const getCategoryColor = (category) => {
    // We can map categories to specific color themes if defined in index.css
    // For now, I'll return 'primary' or generic ones
    const map = {
        'alimentacion': 'success',
        'juguetes': 'warning',
        'accesorios': 'info',
        'salud': 'danger',
        'higiene': 'primary',
        'otros': 'secondary'
    };
    return map[category] || 'primary';
};

export default ProductsManager;
