import React, { useEffect, useMemo, useState } from 'react';
import { Check, Database, ExternalLink, GitBranch, Github, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  approveImportBatch,
  fetchImportBatches,
  fetchSources,
  importGithubRepository,
  rejectImportBatch,
  type ImportBatch,
  type SourceRecord,
} from '../api';
import { useAppStore } from '../store';

export default function ReviewPanel() {
  const loadGraphFromApi = useAppStore((state) => state.loadGraphFromApi);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [repo, setRepo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedId) ?? batches[0] ?? null,
    [batches, selectedId],
  );

  const sourceStats = useMemo(() => {
    return sources.reduce(
      (acc, source) => {
        acc[source.reviewStatus] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );
  }, [sources]);

  const refresh = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [batchResponse, sourceResponse] = await Promise.all([fetchImportBatches(), fetchSources()]);
      setBatches(batchResponse.items);
      setSources(sourceResponse.items);
      setSelectedId((current) => {
        if (current && batchResponse.items.some((batch) => batch.id === current)) return current;
        return batchResponse.items[0]?.id ?? null;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleImportGithub = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanRepo = repo.trim();
    if (!cleanRepo) return;

    setError(null);
    setImportMessage(null);
    setIsImporting(true);
    try {
      const response = await importGithubRepository(cleanRepo);
      setRepo('');
      setImportMessage(`${response.batch.query ?? cleanRepo} has been added to the review queue.`);
      await refresh();
      setSelectedId(response.batch.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'GitHub import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleApprove = async (batchId: string) => {
    setBusyBatchId(batchId);
    setError(null);
    try {
      await approveImportBatch(batchId);
      await Promise.all([refresh(), loadGraphFromApi()]);
      setImportMessage('Batch approved and merged into the graph.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Approval failed.');
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleReject = async (batchId: string, notes: string) => {
    setBusyBatchId(batchId);
    setError(null);
    try {
      await rejectImportBatch(batchId, notes);
      await refresh();
      setImportMessage('Batch rejected and kept in the audit log.');
      setRejectNotes('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Rejection failed.');
    } finally {
      setBusyBatchId(null);
    }
  };

  return (
    <div className="w-full h-full pt-20 pb-10 px-4 md:px-6 overflow-y-auto grid-bg relative">
      <div className="max-w-7xl mx-auto mt-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-gray-200 pb-6 mb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3">
              <ShieldCheck className="size-4" />
              Data Review
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-black text-balance">
              Source & Import Review
            </h1>
            <p className="font-sans text-sm md:text-base text-gray-500 mt-3 max-w-2xl text-pretty">
              Bring external graph data into OpenConstellation through a review queue before it becomes part of the live map.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="self-start lg:self-auto border border-gray-200 bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest text-gray-600 hover:border-black hover:text-black transition-colors flex items-center gap-2"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <aside className="space-y-6">
            <section className="border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-mono text-xs uppercase tracking-widest text-black flex items-center gap-2">
                  <Github className="size-4" />
                  GitHub Import
                </h2>
                {isImporting && <Loader2 className="size-4 animate-spin text-gray-400" />}
              </div>
              <form onSubmit={handleImportGithub} className="space-y-3">
                <label className="block">
                  <span className="sr-only">GitHub repository</span>
                  <input
                    type="text"
                    value={repo}
                    onChange={(event) => setRepo(event.target.value)}
                    placeholder="owner/repo"
                    className="w-full border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isImporting || !repo.trim()}
                  className="w-full bg-black px-3 py-2 font-mono text-xs uppercase tracking-widest text-white disabled:bg-gray-200 disabled:text-gray-500 transition-colors flex items-center justify-center gap-2"
                >
                  <GitBranch className="size-3.5" />
                  Create Draft
                </button>
              </form>
              <p className="font-sans text-xs text-gray-500 mt-3 text-pretty">
                Repository metadata becomes a pending graph node. It is only merged after approval.
              </p>
            </section>

            <section className="border border-gray-200 bg-white p-5">
              <h2 className="font-mono text-xs uppercase tracking-widest text-black flex items-center gap-2 mb-4">
                <Database className="size-4" />
                Source Registry
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Pending" value={sourceStats.pending} />
                <Metric label="Approved" value={sourceStats.approved} />
                <Metric label="Rejected" value={sourceStats.rejected} />
              </div>
            </section>

            <section className="border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs uppercase tracking-widest text-black">Review Queue</h2>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 tabular-nums">
                  {batches.length} batches
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-16 border border-gray-100 bg-gray-50" />
                  ))}
                </div>
              ) : batches.length === 0 ? (
                <div className="border border-dashed border-gray-200 p-4">
                  <p className="font-sans text-sm text-gray-500 text-pretty">
                    No import batches yet. Add a GitHub repository above to create the first draft.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <button
                      type="button"
                      key={batch.id}
                      onClick={() => setSelectedId(batch.id)}
                      className={`w-full text-left border p-3 transition-colors ${
                        selectedBatch?.id === batch.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-sans text-sm font-medium text-black truncate">{batch.query ?? batch.id}</span>
                        <StatusPill status={batch.status} />
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mt-2 tabular-nums">
                        {batch.summary.importedNodes} nodes / {batch.summary.importedEdges} edges / {batch.summary.importedSources} sources
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <section className="min-w-0 border border-gray-200 bg-white">
            {error && (
              <div className="border-b border-red-100 bg-red-50 px-5 py-3 font-sans text-sm text-red-700">
                {error}
              </div>
            )}
            {importMessage && (
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 font-sans text-sm text-gray-700">
                {importMessage}
              </div>
            )}

            {!selectedBatch ? (
              <div className="p-8">
                <div className="border border-dashed border-gray-200 p-8 text-center">
                  <Database className="size-8 mx-auto text-gray-300 mb-4" />
                  <h2 className="font-serif text-2xl font-semibold text-black text-balance">No batch selected</h2>
                  <p className="font-sans text-sm text-gray-500 mt-2 text-pretty">
                    Create a GitHub import draft or select an existing batch from the queue.
                  </p>
                </div>
              </div>
            ) : (
              <BatchDetail
                batch={selectedBatch}
                busy={busyBatchId === selectedBatch.id}
                rejectNotes={rejectNotes}
                onRejectNotesChange={setRejectNotes}
                onApprove={() => void handleApprove(selectedBatch.id)}
                onReject={() => void handleReject(selectedBatch.id, rejectNotes)}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-100 bg-gray-50 p-3">
      <div className="font-mono text-lg text-black tabular-nums">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400 truncate">{label}</div>
    </div>
  );
}

function BatchDetail({
  batch,
  busy,
  rejectNotes,
  onRejectNotesChange,
  onApprove,
  onReject,
}: {
  batch: ImportBatch;
  busy: boolean;
  rejectNotes: string;
  onRejectNotesChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const createdAt = new Date(batch.createdAt).toLocaleString();

  return (
    <div>
      <div className="p-5 border-b border-gray-200 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <StatusPill status={batch.status} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{batch.provider}</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold text-black truncate text-balance">{batch.query ?? batch.id}</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mt-2 tabular-nums">
            {createdAt} / {batch.mode}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy || batch.status === 'approved'}
            className="border border-black bg-black px-3 py-2 font-mono text-xs uppercase tracking-widest text-white disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors flex items-center gap-2"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Approve
          </button>
        </div>
      </div>

      {batch.status === 'pending' && (
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 block mb-2">Reject Notes</span>
            <textarea
              value={rejectNotes}
              onChange={(event) => onRejectNotesChange(event.target.value)}
              rows={2}
              placeholder="Record what should be fixed before this batch is imported."
              className="w-full resize-none border border-gray-200 bg-white px-3 py-2 font-sans text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="border border-gray-200 bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest text-gray-600 hover:border-black hover:text-black disabled:text-gray-300 disabled:hover:border-gray-200 transition-colors flex items-center gap-2"
            >
              <X className="size-3.5" />
              Reject
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200">
        <SummaryCell label="Nodes" value={batch.summary.importedNodes} />
        <SummaryCell label="Edges" value={batch.summary.importedEdges} />
        <SummaryCell label="Sources" value={batch.summary.importedSources} />
        <SummaryCell label="Warnings" value={batch.summary.warnings.length} />
      </div>

      <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DiffSection title="Nodes" empty="No nodes in this batch.">
          {batch.nodes.map((node) => (
            <div key={node.id} className="border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/node/${node.id}`} className="font-sans font-medium text-black hover:underline truncate block">
                    {node.name}
                  </Link>
                  <p className="font-sans text-sm text-gray-500 mt-1 line-clamp-2 text-pretty">{node.description}</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 text-gray-500 shrink-0">
                  {node.type}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {node.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="font-mono text-[9px] uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </DiffSection>

        <DiffSection title="Sources" empty="No sources in this batch.">
          {batch.sources.map((source) => (
            <div key={source.id} className="border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans font-medium text-black hover:underline truncate flex items-center gap-2"
                  >
                    <span className="truncate">{source.title}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-gray-400" />
                  </a>
                  <p className="font-mono text-[10px] text-gray-400 mt-1 truncate">{source.url}</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 text-gray-500 shrink-0">
                  {source.kind}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                <span>{source.trustLevel}</span>
                <span className="text-right">{source.reviewStatus}</span>
              </div>
            </div>
          ))}
        </DiffSection>

        <DiffSection title="Edges" empty="No edges in this batch.">
          {batch.edges.map((edge) => (
            <div key={edge.id} className="border border-gray-100 bg-gray-50 p-4">
              <div className="font-sans text-sm text-black">
                <span className="font-medium">{edge.sourceId}</span>
                <span className="text-gray-400">{' -> '}</span>
                <span className="font-medium">{edge.targetId}</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mt-2">
                {edge.relationType} / weight {edge.weight}
              </div>
            </div>
          ))}
        </DiffSection>

        <DiffSection title="Warnings" empty="No warnings.">
          {batch.summary.warnings.map((warning) => (
            <div key={warning} className="border border-gray-100 bg-gray-50 p-3 font-mono text-[11px] text-gray-600 break-all">
              {warning}
            </div>
          ))}
        </DiffSection>
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border-r border-gray-200 last:border-r-0">
      <div className="font-mono text-2xl text-black tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</div>
    </div>
  );
}

function DiffSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] | React.ReactNode }) {
  const items = React.Children.toArray(children);

  return (
    <section>
      <h3 className="font-mono text-xs uppercase tracking-widest text-black mb-3">{title}</h3>
      {items.length === 0 ? (
        <div className="border border-dashed border-gray-200 p-4 font-sans text-sm text-gray-400">{empty}</div>
      ) : (
        <div className="space-y-3">{items}</div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: ImportBatch['status'] }) {
  const className =
    status === 'approved'
      ? 'border-black text-black bg-gray-50'
      : status === 'rejected'
        ? 'border-gray-200 text-gray-400 bg-white'
        : 'border-gray-300 text-gray-700 bg-white';

  return (
    <span className={`font-mono text-[9px] uppercase tracking-widest border px-2 py-1 shrink-0 ${className}`}>
      {status}
    </span>
  );
}
