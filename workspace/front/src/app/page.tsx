'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronLeft, ChevronRight, Database, Cpu } from 'lucide-react';

// 任务类型定义
interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  imageCount: number;
}

export default function Home() {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 弹窗状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // 生成粒子效果
  useEffect(() => {
    const container = document.body;
    const particleCount = 20;

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

  // 打开新建任务弹窗
  const handleNewTask = () => {
    setIsDialogOpen(true);
    setNewTaskTitle('');
    setNewTaskDescription('');
  };

  // 确认创建任务
  const handleConfirmNewTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      imageCount: 0,
    };
    setTasks([newTask, ...tasks]);
    setIsDialogOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
  };

  // 取消创建任务
  const handleCancelNewTask = () => {
    setIsDialogOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
  };

  // 删除任务
  const handleDeleteTasks = () => {
    if (selectedTaskIds.size === 0) return;
    setTasks(tasks.filter(task => !selectedTaskIds.has(task.id)));
    setSelectedTaskIds(new Set());
    const newTotalPages = Math.ceil((tasks.length - selectedTaskIds.size) / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  // 切换任务选中状态
  const handleToggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  // 切换全选/取消全选当前页
  const handleToggleAllOnPage = (currentTasks: Task[]) => {
    const allSelected = currentTasks.every(task => selectedTaskIds.has(task.id));
    const newSelected = new Set(selectedTaskIds);

    if (allSelected) {
      currentTasks.forEach(task => newSelected.delete(task.id));
    } else {
      currentTasks.forEach(task => newSelected.add(task.id));
    }

    setSelectedTaskIds(newSelected);
  };

  // 翻页逻辑
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = tasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* 动态网格背景 */}
      <div className="tech-grid-bg" />

      <div className="min-h-screen bg-background relative">
        {/* 页面容器 */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* 头部：Logo 和 数字孪生 */}
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src="https://lf-coze-web-cdn.coze.cn/obj/eden-cn/lm-lgvj/ljhwZthlaukjlkulzlp/favicon.svg"
                  alt="Logo"
                  width={56}
                  height={56}
                  unoptimized
                  className="rounded-lg logo-glow"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight glow-text">
                  数字孪生
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Digital Twin Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>{tasks.length} 任务</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span>{tasks.reduce((sum, t) => sum + t.imageCount, 0)} 图片</span>
              </div>
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="mb-6 flex gap-4">
            <Button
              onClick={handleNewTask}
              className="neon-button flex items-center gap-2 px-6"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              新建任务
            </Button>
            <Button
              onClick={handleDeleteTasks}
              className="flex items-center gap-2 px-6"
              size="lg"
              style={{
                background: 'oklch(0.6 0.25 0)',
                border: '1px solid oklch(0.6 0.25 0 / 0.8)',
                boxShadow: '0 0 20px oklch(0.6 0.25 0 / 0.4)',
              }}
              disabled={selectedTaskIds.size === 0}
            >
              <Trash2 className="h-5 w-5" />
              删除任务 ({selectedTaskIds.size})
            </Button>
          </div>

          {/* 任务列表 */}
          {tasks.length === 0 ? (
            <Card className="glass-card flex items-center justify-center p-16 text-muted-foreground">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Database className="h-10 w-10 text-purple-400" />
                </div>
                <p className="text-xl font-semibold mb-2">暂无任务</p>
                <p className="text-sm">点击上方"新建任务"按钮创建任务</p>
              </div>
            </Card>
          ) : (
            <>
              {/* 全选当前页 */}
              <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground px-4">
                <Checkbox
                  id="selectAll"
                  checked={currentTasks.length > 0 && currentTasks.every(task => selectedTaskIds.has(task.id))}
                  onCheckedChange={() => handleToggleAllOnPage(currentTasks)}
                  className="border-purple-400/60 bg-white/5 hover:border-purple-400 data-[state=checked]:border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:hover:bg-purple-600 transition-all"
                />
                <label htmlFor="selectAll" className="cursor-pointer hover:text-foreground transition-colors">
                  全选当前页 ({currentTasks.length} 条)
                </label>
              </div>

              {/* 任务卡片列表 */}
              <div className="space-y-4">
                {currentTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="glass-card p-6 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* 复选框 */}
                      <div className="flex items-center pt-1">
                        <Checkbox
                          id={task.id}
                          checked={selectedTaskIds.has(task.id)}
                          onCheckedChange={() => handleToggleTask(task.id)}
                          className="border-purple-400/60 bg-white/5 hover:border-purple-400 data-[state=checked]:border-purple-400 data-[state=checked]:bg-purple-500 data-[state=checked]:hover:bg-purple-600 transition-all"
                        />
                      </div>

                      {/* 任务内容 */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 glow-text">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-purple-400" />
                            {task.createdAt}
                          </span>
                          <span className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-400" />
                            已上传：{task.imageCount} 张
                          </span>
                        </div>
                      </div>

                      {/* 查看详情按钮 */}
                      <Link href={`/task/${task.id}`}>
                        <Button
                          className="neon-button-secondary"
                          size="sm"
                          asChild
                        >
                          <span className="flex items-center gap-2">
                            查看详情
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="neon-button-secondary flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>

                  {/* 页码显示 */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={`min-w-[40px] ${
                              currentPage === page
                                ? 'neon-button'
                                : 'neon-button-secondary'
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-2 text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="neon-button-secondary flex items-center gap-1"
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* 底部统计信息 */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                共 {tasks.length} 个任务，当前第 {currentPage} / {totalPages} 页
              </div>
            </>
          )}
        </div>
      </div>

      {/* 新建任务弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold glow-text">
              新建任务
            </DialogTitle>
            <DialogDescription>
              请填写任务的基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">
                任务标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="请输入任务标题"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="border-purple-400/60 bg-white/5 focus:border-purple-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">
                任务描述（可选）
              </Label>
              <Textarea
                id="task-description"
                placeholder="请输入任务描述..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={4}
                className="border-purple-400/60 bg-white/5 focus:border-purple-400 transition-all resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCancelNewTask}
              className="neon-button-secondary px-6"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmNewTask}
              disabled={!newTaskTitle.trim()}
              className="neon-button px-6"
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
