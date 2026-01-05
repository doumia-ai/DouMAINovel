import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Input, message, Empty, Card, Tag, Space, Divider, Typography, Collapse, Spin, Row, Col } from 'antd';
import { BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import api from '../services/api';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Genre {
    id: string;
    name: string;
    is_builtin: boolean;
    description?: string;
    world_building_guide?: string;
    character_guide?: string;
    plot_guide?: string;
    writing_style_guide?: string;
    example_works?: string;
    keywords?: string[];
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

interface GenreListResponse {
    genres: Genre[];
    total: number;
}

export default function Genres() {
    const navigate = useNavigate();
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
    const [form] = Form.useForm();
    const [modal, contextHolder] = Modal.useModal();

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            setLoading(true);
            const response: GenreListResponse = await api.get('/genres');
            setGenres(response.genres || []);
        } catch (error: any) {
            console.error('获取类型列表失败:', error);
            message.error('获取类型列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (genre?: Genre) => {
        if (genre) {
            setEditingGenre(genre);
            form.setFieldsValue({
                ...genre,
                keywords: genre.keywords?.join('、') || ''
            });
        } else {
            setEditingGenre(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            // 解析关键词
            const keywordsText = values.keywords || '';
            const keywords = keywordsText.split(/[、,，]/).map((k: string) => k.trim()).filter((k: string) => k);

            const data = {
                ...values,
                keywords
            };

            if (editingGenre) {
                await api.put(`/genres/${editingGenre.id}`, data);
                message.success('类型更新成功');
            } else {
                await api.post('/genres', data);
                message.success('类型创建成功');
            }

            setIsModalOpen(false);
            form.resetFields();
            fetchGenres();
        } catch (error: any) {
            message.error(error.response?.data?.detail || '操作失败');
        }
    };

    const handleDelete = async (id: string, name: string, isBuiltin: boolean) => {
        if (isBuiltin) {
            message.warning('内置类型不能删除');
            return;
        }

        modal.confirm({
            title: '确认删除',
            content: `确定要删除类型"${name}"吗？`,
            centered: true,
            onOk: async () => {
                try {
                    await api.delete(`/genres/${id}`);
                    message.success('类型删除成功');
                    fetchGenres();
                } catch (error: any) {
                    message.error(error.response?.data?.detail || '删除失败');
                }
            }
        });
    };

    const renderGenreCard = (genre: Genre) => (
        <Card
            key={genre.id}
            title={
                <Space>
                    <BookOutlined />
                    {genre.name}
                    {genre.is_builtin ? (
                        <Tag color="blue" icon={<LockOutlined />}>内置</Tag>
                    ) : (
                        <Tag color="green">自定义</Tag>
                    )}
                </Space>
            }
            extra={
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(genre)}
                        title={genre.is_builtin ? '内置类型只能修改描述和指导配置' : '编辑'}
                    />
                    {!genre.is_builtin && (
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(genre.id, genre.name, genre.is_builtin)}
                        />
                    )}
                </Space>
            }
            style={{ marginBottom: 16 }}
        >
            <Paragraph ellipsis={{ rows: 2 }}>{genre.description || '暂无描述'}</Paragraph>

            {genre.keywords && genre.keywords.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <Text strong>关键元素：</Text>
                    <div style={{ marginTop: 4 }}>
                        {genre.keywords.map((keyword, index) => (
                            <Tag key={index} style={{ marginBottom: 4 }}>{keyword}</Tag>
                        ))}
                    </div>
                </div>
            )}

            {genre.example_works && (
                <div style={{ marginBottom: 12 }}>
                    <Text strong>参考作品：</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{genre.example_works}</Text>
                </div>
            )}

            <Collapse ghost size="small">
                {genre.world_building_guide && (
                    <Panel header="世界观构建指导" key="world">
                        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {genre.world_building_guide}
                        </Paragraph>
                    </Panel>
                )}
                {genre.character_guide && (
                    <Panel header="角色塑造指导" key="character">
                        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {genre.character_guide}
                        </Paragraph>
                    </Panel>
                )}
                {genre.plot_guide && (
                    <Panel header="情节设计指导" key="plot">
                        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {genre.plot_guide}
                        </Paragraph>
                    </Panel>
                )}
                {genre.writing_style_guide && (
                    <Panel header="写作风格指导" key="style">
                        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {genre.writing_style_guide}
                        </Paragraph>
                    </Panel>
                )}
            </Collapse>
        </Card>
    );

    // 分离内置类型和自定义类型
    const builtinGenres = genres.filter(g => g.is_builtin);
    const customGenres = genres.filter(g => !g.is_builtin);

    return (
        <>
            {contextHolder}
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'var(--color-bg-layout)'
            }}>
                {/* 固定头部 */}
                <div style={{
                    padding: '16px 24px',
                    background: 'var(--color-bg-container)',
                    borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/projects')}
                            >
                                返回
                            </Button>
                            <Title level={3} style={{ margin: 0 }}>
                                <BookOutlined style={{ marginRight: 8 }} />
                                小说类型管理
                            </Title>
                        </Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                        >
                            新增类型
                        </Button>
                    </div>
                    <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                        管理小说类型及其AI生成指导配置。内置类型提供了常见小说类型的专业指导，您也可以创建自定义类型。
                    </Text>
                </div>

                {/* 可滚动的内容区域 */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '16px 24px'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Spin size="large" />
                        </div>
                    ) : genres.length === 0 ? (
                        <Empty description="暂无类型数据" />
                    ) : (
                        <>
                            {/* 内置类型 */}
                            {builtinGenres.length > 0 && (
                                <>
                                    <Divider orientation="left">
                                        <Space>
                                            <LockOutlined />
                                            内置类型 ({builtinGenres.length})
                                        </Space>
                                    </Divider>
                                    <Row gutter={[16, 16]}>
                                        {builtinGenres.map(genre => (
                                            <Col key={genre.id} xs={24} sm={24} md={12} lg={8} xl={8}>
                                                {renderGenreCard(genre)}
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}

                            {/* 自定义类型 */}
                            {customGenres.length > 0 && (
                                <>
                                    <Divider orientation="left">
                                        <Space>
                                            <PlusOutlined />
                                            自定义类型 ({customGenres.length})
                                        </Space>
                                    </Divider>
                                    <Row gutter={[16, 16]}>
                                        {customGenres.map(genre => (
                                            <Col key={genre.id} xs={24} sm={24} md={12} lg={8} xl={8}>
                                                {renderGenreCard(genre)}
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            )}

                            {customGenres.length === 0 && builtinGenres.length > 0 && (
                                <>
                                    <Divider orientation="left">
                                        <Space>
                                            <PlusOutlined />
                                            自定义类型
                                        </Space>
                                    </Divider>
                                    <Empty
                                        description="暂无自定义类型"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    >
                                        <Button type="primary" onClick={() => handleOpenModal()}>
                                            创建自定义类型
                                        </Button>
                                    </Empty>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* 创建/编辑对话框 */}
                <Modal
                    title={editingGenre ? `编辑类型: ${editingGenre.name}` : '新增类型'}
                    open={isModalOpen}
                    onCancel={() => {
                        setIsModalOpen(false);
                        form.resetFields();
                    }}
                    footer={null}
                    width={800}
                >
                    {editingGenre?.is_builtin && (
                        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#e6f7ff', borderRadius: 4 }}>
                            <Text type="secondary">
                                <LockOutlined style={{ marginRight: 8 }} />
                                内置类型只能修改描述和AI指导配置，不能修改名称。
                            </Text>
                        </div>
                    )}
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="类型名称"
                                    name="name"
                                    rules={[{ required: true, message: '请输入类型名称' }]}
                                >
                                    <Input
                                        placeholder="如：玄幻、都市、科幻"
                                        disabled={editingGenre?.is_builtin}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="关键元素"
                                    name="keywords"
                                    tooltip="用顿号或逗号分隔多个关键词"
                                >
                                    <Input placeholder="如：修炼、异能、宗门、境界" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="类型描述" name="description">
                            <TextArea rows={2} placeholder="描述这个类型的特点..." />
                        </Form.Item>

                        <Form.Item label="参考作品" name="example_works">
                            <Input placeholder="如：《斗破苍穹》《武动乾坤》《大主宰》" />
                        </Form.Item>

                        <Divider>AI生成指导配置</Divider>

                        <Form.Item
                            label="世界观构建指导"
                            name="world_building_guide"
                            tooltip="AI生成世界观时的参考指导"
                        >
                            <TextArea
                                rows={4}
                                placeholder="世界观构建要点：&#10;1. 设计独特的修炼体系&#10;2. 构建完整的势力分布&#10;3. 设定天地法则和异能来源"
                            />
                        </Form.Item>

                        <Form.Item
                            label="角色塑造指导"
                            name="character_guide"
                            tooltip="AI生成角色时的参考指导"
                        >
                            <TextArea
                                rows={4}
                                placeholder="角色塑造要点：&#10;1. 主角通常有特殊体质或机缘&#10;2. 设计清晰的成长路线和目标"
                            />
                        </Form.Item>

                        <Form.Item
                            label="情节设计指导"
                            name="plot_guide"
                            tooltip="AI生成大纲和情节时的参考指导"
                        >
                            <TextArea
                                rows={4}
                                placeholder="情节设计要点：&#10;1. 以主角修炼成长为主线&#10;2. 穿插各种机缘和挑战"
                            />
                        </Form.Item>

                        <Form.Item
                            label="写作风格指导"
                            name="writing_style_guide"
                            tooltip="AI生成章节内容时的风格参考"
                        >
                            <TextArea
                                rows={4}
                                placeholder="写作风格建议：&#10;1. 战斗场面要热血激昂&#10;2. 修炼描写要有代入感"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setIsModalOpen(false)}>取消</Button>
                                <Button type="primary" htmlType="submit">
                                    {editingGenre ? '更新' : '创建'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}
