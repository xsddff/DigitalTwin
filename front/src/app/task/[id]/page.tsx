'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, CheckCircle2, XCircle, ChevronRight, ChevronDown, ChevronUp, Cpu, Image as ImageIcon, HardDrive, Activity, RefreshCw, Camera, CameraOff, Video, VideoOff, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

// 图片信息类型
interface ImageInfo {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  key?: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    colorSpace: string;
    fileName: string;
    format: string;
  };
}

export default function TaskUploadPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [images, setImages] = useState<ImageInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isFileListExpanded, setIsFileListExpanded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [resultsCurrentPage, setResultsCurrentPage] = useState(1);

  // 每页显示的成功文件数量
  const RESULTS_PER_PAGE = 3;

  // 生成粒子效果
  useEffect(() => {
    const container = document.body;
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 15}s`;
      particle.style.animationDuration = `${15 + Math.random() * 10}s`;
      container.appendChild(particle);
    }

    return () => {
      document.querySelectorAll('.particle').forEach(p => p.remove());
    };
  }, []);

  // 统计信息
  const successCount = images.filter(img => img.status === 'success').length;
  const failedCount = images.filter(img => img.status === 'failed').length;
  const totalCount = images.length;

  // 计算总体进度
  const totalProgress = totalCount === 0 ? 0 :
    images.reduce((sum, img) => sum + img.progress, 0) / totalCount;

  // 计算成功文件的总页数
  const successImages = images.filter(img => img.status === 'success' && img.metadata);
  const totalResultsPages = Math.ceil(successImages.length / RESULTS_PER_PAGE);

  // 计算当前页的成功文件
  const currentResultsStartIndex = (resultsCurrentPage - 1) * RESULTS_PER_PAGE;
  const currentResultsEndIndex = currentResultsStartIndex + RESULTS_PER_PAGE;
  const currentResultsPageImages = successImages.slice(currentResultsStartIndex, currentResultsEndIndex);

  // 获取图片元数据
  const getImageMetadata = (file: File): Promise<{ width: number; height: number; colorSpace: string; format: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let colorSpace = 'sRGB';

        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            const imageData = ctx.getImageData(0, 0, 1, 1);
            colorSpace = 'sRGB';
          } catch (e) {
            colorSpace = '未知';
          }
        }

        URL.revokeObjectURL(url);

        resolve({
          width: img.width,
          height: img.height,
          colorSpace,
          format: file.type.split('/')[1]?.toUpperCase() || '未知'
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法读取图片'));
      };

      img.src = url;
    });
  };

  // 选择文件
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: ImageInfo[] = [];

    for (const file of files) {
      try {
        const metadata = await getImageMetadata(file);
        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          progress: 0,
          metadata: {
            ...metadata,
            fileName: file.name,
          },
        });
      } catch (error) {
        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          status: 'pending',
          progress: 0,
        });
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setIsFileListExpanded(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 开始拍摄
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // 视频元素会在 useEffect 中自动连接到 stream
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请确保已授予权限');
    }
  };

  // 停止拍摄
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // 切换拍摄状态
  const handleToggleCamera = () => {
    if (isCameraActive) {
      handleStopCamera();
    } else {
      handleStartCamera();
    }
  };

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 将视频流连接到 video 元素
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (video && stream) {
      video.srcObject = stream;

      const handleLoadedMetadata = () => {
        video.play().catch(err => {
          console.error('视频播放失败:', err);
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [isCameraActive]);

  // 上传单个文件
  const uploadFile = async (imageInfo: ImageInfo): Promise<void> => {
    const formData = new FormData();
    formData.append('file', imageInfo.file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setImages(prev =>
            prev.map(img =>
              img.id === imageInfo.id ? { ...img, progress } : img
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setImages(prev =>
              prev.map(img =>
                img.id === imageInfo.id
                  ? { ...img, status: 'success', progress: 100, key: response.key }
                  : img
              )
            );
            resolve();
          } catch (e) {
            setImages(prev =>
              prev.map(img =>
                img.id === imageInfo.id
                  ? { ...img, status: 'failed', error: '响应解析失败' }
                  : img
              )
            );
            reject(new Error('响应解析失败'));
          }
        } else {
          setImages(prev =>
            prev.map(img =>
              img.id === imageInfo.id
                ? { ...img, status: 'failed', error: `上传失败 (${xhr.status})` }
                : img
            )
          );
          reject(new Error(`上传失败 (${xhr.status})`));
        }
      });

      xhr.addEventListener('error', () => {
        setImages(prev =>
          prev.map(img =>
            img.id === imageInfo.id
              ? { ...img, status: 'failed', error: '网络错误' }
              : img
          )
        );
        reject(new Error('网络错误'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  // 开始上传
  const handleUpload = async () => {
    if (!images || images.length === 0) {
      return;
    }

    const pendingImages = images.filter(img => img.status === 'pending' && img?.id);
    if (pendingImages.length === 0) return;

    setIsUploading(true);
    setShowResults(false);

    setImages(prev =>
      (prev || []).map(img =>
        img?.status === 'pending' && img?.id ? { ...img, status: 'uploading', progress: 0 } : img
      )
    );

    for (const img of pendingImages) {
      if (!img?.id) continue;

      setImages(prev =>
        (prev || []).map(i => i?.id === img.id ? { ...i, status: 'uploading' } : i)
      );

      try {
        await uploadFile(img);
      } catch (error) {
        console.error('上传失败:', error);
      }
    }

    setIsUploading(false);
  };

  // 重新上传失败的文件
  const handleRetry = async () => {
    if (!images || images.length === 0) {
      return;
    }

    const failedImages = images.filter(img => img.status === 'failed' && img?.id);
    if (failedImages.length === 0) return;

    setIsUploading(true);

    for (const img of failedImages) {
      if (!img?.id) continue;

      setImages(prev =>
        (prev || []).map(i => i?.id === img.id ? { ...i, status: 'uploading', progress: 0 } : i)
      );

      try {
        await uploadFile(img);
      } catch (error) {
        console.error('重试失败:', error);
      }
    }

    setIsUploading(false);
  };

  // 切换展开/收起
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 重置
  const handleReset = () => {
    setImages([]);
    setShowResults(false);
    setExpandedItems(new Set());
    setIsFileListExpanded(false);
  };

  const allSuccess = successCount === totalCount && totalCount > 0;
  const hasFailed = failedCount > 0;

  return (
    <>
      {/* 动态网格背景 */}
      <div className="tech-grid-bg" />

      <div className="min-h-screen bg-background relative">
        <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 neon-button-secondary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          {/* 页面标题 */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 glow-text">任务详情</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" />
              任务ID: {taskId}
            </p>
          </div>

          {/* 实时拍摄区域 */}
          <Card className="glass-card p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold glow-text mb-2 flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-400" />
                实时拍摄
              </h2>
              <p className="text-sm text-muted-foreground">
                使用摄像头实时拍摄并上传图片
              </p>
            </div>

            {/* 视频预览区域 */}
            <div className="relative mb-4 bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {/* 视频元素 - 始终渲染，通过 CSS 控制显示/隐藏 */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* 未激活时的占位内容 */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                  <VideoOff className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}

              {/* 拍摄状态指示器 */}
              {isCameraActive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm">拍摄中</span>
                </div>
              )}
            </div>

            {/* 拍摄按钮 */}
            <div className="flex justify-center">
              <Button
                onClick={handleToggleCamera}
                className={`neon-button px-8 ${
                  isCameraActive ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
                size="lg"
              >
                {isCameraActive ? (
                  <>
                    <VideoOff className="mr-2 h-5 w-5" />
                    停止拍摄
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-5 w-5" />
                    开始拍摄
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 上传区域 */}
          <Card className="glass-card p-8 mb-6">
            <div className="upload-zone p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Upload className="h-10 w-10 text-purple-400" />
              </div>
              <p className="text-xl font-semibold mb-2 glow-text">点击或拖拽文件到此处上传</p>
              <p className="text-sm text-muted-foreground mb-4">
                支持 JPG、PNG、GIF 等常见图片格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="neon-button px-8"
                size="lg"
              >
                选择图片
              </Button>
            </div>
          </Card>

          {/* 已选择的文件列表 */}
          {images.length > 0 && (
            <Card className="glass-card p-6 mb-6">
              {/* 文件列表标题栏（可点击展开/收起） */}
              <div
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => setIsFileListExpanded(!isFileListExpanded)}
              >
                <div className="flex items-center gap-2">
                  {isFileListExpanded ? (
                    <ChevronDown className="h-5 w-5 text-purple-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-purple-400" />
                  )}
                  <h2 className="text-xl font-semibold">
                    已选择 {images.length} 个文件
                  </h2>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isUploading && images.some(img => img.status === 'pending') && (
                    <Button onClick={handleUpload} className="neon-button px-6">
                      开始上传
                    </Button>
                  )}
                  {!isUploading && hasFailed && (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="neon-button-secondary flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      重试失败
                    </Button>
                  )}
                  {!isUploading && totalCount > 0 && (
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      重置
                    </Button>
                  )}
                </div>
              </div>

              {/* 文件列表（可折叠） */}
              {isFileListExpanded && (
                <div className="space-y-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`tech-border rounded-lg p-4 transition-all duration-300 ${
                        img.status === 'success' ? 'success-pulse' :
                        img.status === 'failed' ? 'error-shake' : ''
                      }`}
                      style={{
                        background: 'oklch(0.15 0.02 270 / 0.4)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {img.status === 'success' && (
                                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                              )}
                              {img.status === 'failed' && (
                                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                              )}
                              {img.status === 'uploading' && (
                                <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                              )}
                              {img.status === 'pending' && (
                                <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded-full flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate">
                                {img.file.name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(img.file.size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 进度条 */}
                      {img.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="tech-progress h-2">
                            <div
                              className="tech-progress-bar h-full transition-all duration-300"
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-right font-mono">
                            {img.progress}%
                          </div>
                        </div>
                      )}

                      {/* 错误信息 */}
                      {img.status === 'failed' && img.error && (
                        <div className="mt-2 text-xs text-red-400 font-mono">
                          {img.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 上传进度（总体） */}
          {isUploading && (
            <Card className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400 loading-glow" />
                  上传中...
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  {totalProgress.toFixed(0)}%
                </span>
              </div>
              <div className="tech-progress h-3">
                <div
                  className="tech-progress-bar h-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right font-mono">
                {totalProgress.toFixed(0)}%
              </div>
            </Card>
          )}

          {/* 上传结果提示 */}
          {!isUploading && totalCount > 0 && successCount + failedCount > 0 && (
            <Card
              className="glass-card p-6 mb-6"
              style={{
                border: `2px solid ${
                  allSuccess
                    ? 'oklch(0.65 0.2 150 / 0.6)'
                    : 'oklch(0.6 0.25 0 / 0.6)'
                }`,
                boxShadow: allSuccess
                  ? '0 0 30px oklch(0.65 0.2 150 / 0.3)'
                  : '0 0 30px oklch(0.6 0.25 0 / 0.3)',
              }}
            >
              <div
                className={`text-lg font-semibold ${
                  allSuccess ? 'text-green-400' : 'text-red-400'
                } flex items-center gap-3`}
              >
                {allSuccess ? (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    <span>全部上传成功！成功 {successCount} 张</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    <span>上传完成：成功 {successCount} 张，失败 {failedCount} 张</span>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* 查看上传结果按钮 */}
          {!isUploading && successCount > 0 && (
            <Button
              onClick={() => setShowResults(!showResults)}
              className="w-full mb-6 neon-button-secondary flex items-center justify-center gap-2"
              size="lg"
            >
              {showResults ? '隐藏上传结果' : '查看上传结果'}
              {showResults ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* 上传结果详情 */}
          {showResults && successCount > 0 && (
            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-400" />
                成功上传的文件
              </h3>
              <div className="space-y-3">
                {currentResultsPageImages.map((img) => (
                    <div
                      key={img.id}
                      className="tech-border rounded-lg overflow-hidden"
                      style={{
                        background: 'oklch(0.15 0.02 270 / 0.4)',
                      }}
                    >
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleExpand(img.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center success-pulse">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          </div>
                          <span className="font-medium">{img.metadata?.fileName}</span>
                        </div>
                        {expandedItems.has(img.id) ? (
                          <ChevronUp className="h-4 w-4 text-purple-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-purple-400" />
                        )}
                      </div>

                      {/* 详细信息 */}
                      {expandedItems.has(img.id) && img.metadata && (
                        <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-purple-400" />
                              <span className="text-muted-foreground">分辨率：</span>
                              <span className="font-mono">{img.metadata.width} × {img.metadata.height}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-blue-400" />
                              <span className="text-muted-foreground">色彩空间：</span>
                              <span className="font-mono">{img.metadata.colorSpace}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4 text-green-400" />
                              <span className="text-muted-foreground">文件名称：</span>
                              <span className="font-medium truncate">{img.metadata.fileName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-purple-400" />
                              <span className="text-muted-foreground">文件格式：</span>
                              <span className="font-mono">{img.metadata.format}</span>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-white/10">
                            <span className="text-xs text-muted-foreground">存储Key：</span>
                            <span className="text-xs font-mono break-all block mt-1 text-purple-300">
                              {img.key}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* 翻页控制 */}
              {totalResultsPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResultsCurrentPage(p => Math.max(1, p - 1))}
                    disabled={resultsCurrentPage === 1}
                    className="neon-button-secondary"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      第 {resultsCurrentPage} / {totalResultsPages} 页
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: totalResultsPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setResultsCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-all ${
                            resultsCurrentPage === i + 1
                              ? 'bg-purple-600 text-white neon-button'
                              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResultsCurrentPage(p => Math.min(totalResultsPages, p + 1))}
                    disabled={resultsCurrentPage === totalResultsPages}
                    className="neon-button-secondary"
                  >
                    下一页
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
