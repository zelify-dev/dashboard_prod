"use client";

import { FinancialEducationConfig } from "./financial-education-config";
import { useFinancialEducationTranslations } from "./use-financial-education-translations";

interface FinancialEducationConfigPanelProps {
  config: FinancialEducationConfig;
  updateConfig: (updates: Partial<FinancialEducationConfig>) => void;
}

export function FinancialEducationConfigPanel({
  config,
  updateConfig,
}: FinancialEducationConfigPanelProps) {
  const t = useFinancialEducationTranslations();

  return (
    <div className="space-y-6">
      {/* Configuración de Videos */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-financial-academy">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t.configPanel.academyVideos.title}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.configPanel.academyVideos.description}
            </p>
            <button
              onClick={() => {
                const newVideo = {
                  id: `video-${Date.now()}`,
                  title: t.configPanel.academyVideos.newTitle,
                  url: "",
                  thumbnail: ""
                };
                updateConfig({
                  videos: [...config.videos, newVideo]
                });
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              {t.configPanel.academyVideos.addButton}
            </button>
          </div>
          <div className="space-y-3">
            {config.videos.map((video, index) => (
              <div key={video.id} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.academyVideos.fields.title}
                  </label>
                  <input
                    type="text"
                    value={video.title}
                    onChange={(e) => {
                      const updatedVideos = [...config.videos];
                      updatedVideos[index] = { ...video, title: e.target.value };
                      updateConfig({ videos: updatedVideos });
                    }}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.academyVideos.fields.videoUrl}
                  </label>
                  <input
                    type="url"
                    value={video.url}
                    onChange={(e) => {
                      const updatedVideos = [...config.videos];
                      updatedVideos[index] = { ...video, url: e.target.value };
                      updateConfig({ videos: updatedVideos });
                    }}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.academyVideos.fields.thumbnailUrl}
                  </label>
                  <input
                    type="url"
                    value={video.thumbnail}
                    onChange={(e) => {
                      const updatedVideos = [...config.videos];
                      updatedVideos[index] = { ...video, thumbnail: e.target.value };
                      updateConfig({ videos: updatedVideos });
                    }}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    updateConfig({
                      videos: config.videos.filter((v) => v.id !== video.id)
                    });
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t.configPanel.academyVideos.delete}
                </button>
              </div>
            ))}
            {config.videos.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t.configPanel.academyVideos.empty}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Configuración de Blogs */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-financial-blogs">
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t.configPanel.blogs.title}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.configPanel.blogs.description}
            </p>
            <button
              onClick={() => {
                const newBlog = {
                  id: `blog-${Date.now()}`,
                  title: t.configPanel.blogs.newTitle,
                  url: "",
                  excerpt: ""
                };
                updateConfig({
                  blogs: [...config.blogs, newBlog]
                });
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              {t.configPanel.blogs.addButton}
            </button>
          </div>
          <div className="space-y-3">
            {config.blogs.map((blog, index) => (
              <div key={blog.id} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.blogs.fields.title}
                  </label>
                  <input
                    type="text"
                    value={blog.title}
                    onChange={(e) => {
                      const updatedBlogs = [...config.blogs];
                      updatedBlogs[index] = { ...blog, title: e.target.value };
                      updateConfig({ blogs: updatedBlogs });
                    }}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.blogs.fields.blogUrl}
                  </label>
                  <input
                    type="url"
                    value={blog.url}
                    onChange={(e) => {
                      const updatedBlogs = [...config.blogs];
                      updatedBlogs[index] = { ...blog, url: e.target.value };
                      updateConfig({ blogs: updatedBlogs });
                    }}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                    {t.configPanel.blogs.fields.excerpt}
                  </label>
                  <textarea
                    value={blog.excerpt}
                    onChange={(e) => {
                      const updatedBlogs = [...config.blogs];
                      updatedBlogs[index] = { ...blog, excerpt: e.target.value };
                      updateConfig({ blogs: updatedBlogs });
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    updateConfig({
                      blogs: config.blogs.filter((b) => b.id !== blog.id)
                    });
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {t.configPanel.blogs.delete}
                </button>
              </div>
            ))}
            {config.blogs.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t.configPanel.blogs.empty}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
