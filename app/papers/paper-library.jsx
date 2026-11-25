'use client';

import { useEffect, useRef, useState } from 'react';
import { all, collect, isPaper, remove, save } from './store';
import { taskId } from '../../js/task-model.mjs';

export default function PaperLibrary({ workspace }) {
  const [papers, setPapers] = useState([]);
  const [directory, setDirectory] = useState(null);
  const [local, setLocal] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fallback = useRef(null);

  useEffect(() => {
    all().then((records) => {
      setPapers(records.filter((record) => record.kind !== 'directory'));
      setDirectory(records.find((record) => record.kind === 'directory')?.handle ?? null);
    }).catch(() => setStatus('无法读取论文库，请检查浏览器的存储权限。'));
  }, []);

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (error.name !== 'AbortError') {
        setStatus(error.name === 'QuotaExceededError'
          ? '浏览器存储空间不足，请清理部分论文后再试。'
          : '操作未完成，请检查目录权限或浏览器存储设置后重试。');
      }
    } finally {
      setBusy(false);
    }
  }

  async function addLink(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      let url;
      try { url = new URL(data.get('url')); } catch {}
      if (!url || !['https:', 'http:'].includes(url.protocol)) {
        setStatus('请输入以 https:// 或 http:// 开头的论文链接。');
        return;
      }
      const entry = { id: 'link:' + url.href, kind: 'link', title: data.get('title').trim() || url.hostname, url: url.href };
      await save(entry.id, entry);
      setPapers((items) => [...items.filter((item) => item.id !== entry.id), entry]);
      form.reset();
      setStatus('链接已收藏。');
    });
  }

  async function addFiles(event) {
    const files = [...event.target.files];
    event.target.value = '';
    await run(async () => {
      let added = 0;
      for (const file of files.filter((item) => isPaper(item.name))) {
        const entry = { id: 'file:' + taskId(), kind: 'file', title: file.name, file };
        await save(entry.id, entry);
        setPapers((items) => [...items, entry]);
        added++;
      }
      setStatus(added ? '已保存 ' + added + ' 份文件。' : '请选择 PDF、DJVU、EPUB 或 Word 文件。');
    });
  }

  async function chooseDirectory() {
    if (!window.showDirectoryPicker) {
      fallback.current.click();
      return;
    }
    await run(async () => {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      const results = await collect(handle);
      await save('directory', { kind: 'directory', handle });
      setDirectory(handle);
      setLocal(results);
      setStatus('已找到 ' + results.length + ' 份本地文件。');
    });
  }

  async function refreshDirectory() {
    await run(async () => {
      const permission = await directory.requestPermission({ mode: 'read' });
      if (permission !== 'granted') {
        setStatus('请授权读取目录，或重新选择目录。');
        return;
      }
      const results = await collect(directory);
      setLocal(results);
      setStatus('已重新扫描，共 ' + results.length + ' 份文件。');
    });
  }

  function importDirectory(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    const results = files.filter((file) => isPaper(file.name))
      .map((file) => ({ file, path: file.webkitRelativePath || file.name }));
    setLocal(results);
    setStatus('已扫描 ' + results.length + ' 份文件。当前浏览器需要在刷新页面后重新选择目录。');
  }

  async function download(entry) {
    await run(async () => {
      const file = entry.file ?? await entry.handle.getFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    });
  }

  const matches = (value) => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const savedResults = papers.filter((item) => matches(item.title + ' ' + (item.url ?? '')));
  const localResults = local.filter((item) => matches(item.path));

  return (
    <main className="paper-library">
      <a href={workspace}>← 返回学习工作台</a>
      <h1>论文库</h1>
      <p>收藏论文网址，保存文件副本，或在电脑上已选择的文件夹里按名称查找论文。</p>
      <section>
        <h2>收藏论文</h2>
        <form onSubmit={addLink}>
          <label>论文标题（可选）<input name="title" /></label>
          <label>论文网址<input type="url" name="url" placeholder="https://…" required /></label>
          <button disabled={busy}>收藏链接</button>
        </form>
        <label>保存论文文件到此浏览器<input type="file" multiple accept=".pdf,.djvu,.epub,.doc,.docx" onChange={addFiles} disabled={busy} /></label>
        <p>收藏和文件副本保存在当前浏览器。清除站点数据会删除这些内容，请保留原文件。</p>
      </section>
      <section>
        <h2>查找本地论文</h2>
        <button disabled={busy} onClick={chooseDirectory}>选择论文文件夹</button>{' '}
        {directory && <>
          <span>已关联：{directory.name}</span>{' '}
          <button disabled={busy} onClick={refreshDirectory}>重新扫描</button>{' '}
          <button disabled={busy} onClick={() => run(async () => {
            await remove('directory');
            setDirectory(null);
            setLocal([]);
            setStatus('已取消关联。');
          })}>取消关联</button>
        </>}
        <input ref={fallback} type="file" webkitdirectory="" multiple hidden onChange={importDirectory} />
        <p>可扫描选定目录和子目录。论文文件留在电脑上，网页只能搜索你选择的范围。</p>
        <details>
          <summary>如何让浏览器把论文下载到固定文件夹？</summary>
          <ol>
            <li>在电脑上建一个文件夹，例如「下载／论文」。现有论文也可以移进去。</li>
            <li>在 Chrome 或 Edge 打开「设置 → 下载」，把下载位置改到这个文件夹。只想把论文放进去时，可以打开「下载前询问保存位置」，下载论文时再选择该目录。</li>
            <li>回到本页点「选择论文文件夹」。支持目录授权的浏览器可以保存关联，下次点「重新扫描」。普通 HTTP 或不支持持久授权的浏览器可以重新选目录扫描。</li>
          </ol>
        </details>
      </section>
      <p role="status">{busy ? '正在处理…' : status}</p>
      <label>搜索论文<input type="search" placeholder="按标题、网址或本地文件路径搜索" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <section>
        <h2>我的收藏（{savedResults.length}）</h2>
        {!savedResults.length && <p>没有匹配的收藏。</p>}
        <ul>{savedResults.map((item) => <li key={item.id}>
          {item.kind === 'link' ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : <span>{item.title}</span>}
          {item.kind === 'file' && <button disabled={busy} onClick={() => download(item)}>下载</button>}
          <button disabled={busy} onClick={() => run(async () => {
            await remove(item.id);
            setPapers((items) => items.filter((paper) => paper.id !== item.id));
            setStatus('已从收藏移除。');
          })}>移除</button>
        </li>)}</ul>
      </section>
      <section>
        <h2>本地搜索结果（{localResults.length}）</h2>
        {!localResults.length && <p>没有匹配文件。可以选择目录或调整搜索词。</p>}
        <ul>{localResults.map((item) => <li key={item.path}>
          <span>{item.path}</span>
          <button disabled={busy} onClick={() => download(item)}>下载副本</button>
        </li>)}</ul>
      </section>
    </main>
  );
}
