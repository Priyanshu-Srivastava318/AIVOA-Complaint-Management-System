import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UploadCloud, FileText } from 'lucide-react'
import { runExtraction, setExtractionProgress } from '../store/complaintSlice'

export default function FileUpload() {
  const dispatch = useDispatch()
  const { status, extractionProgress } = useSelector((s) => s.complaints)
  const [mode, setMode] = useState('file') // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const extracting = status === 'extracting'

  const startFakeProgress = () => {
    dispatch(setExtractionProgress(10))
    let pct = 10
    const interval = setInterval(() => {
      pct = Math.min(pct + 15, 90)
      dispatch(setExtractionProgress(pct))
      if (pct >= 90) clearInterval(interval)
    }, 400)
    return interval
  }

  const handleFile = (file) => {
    if (!file) return
    const interval = startFakeProgress()
    dispatch(runExtraction({ file })).finally(() => clearInterval(interval))
  }

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return
    const interval = startFakeProgress()
    dispatch(runExtraction({ text: pastedText })).finally(() => clearInterval(interval))
  }

  return (
    <div className="space-y-3">
      {mode === 'file' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <UploadCloud className="mx-auto h-6 w-6 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Drag &amp; drop complaint document here
            <br />
            or <span className="text-brand-600 font-medium">click to browse</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.eml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste complaint email or text here..."
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={extracting || !pastedText.trim()}
            className="w-full rounded-md bg-brand-600 text-white text-sm font-medium py-2 hover:bg-brand-700 disabled:opacity-50"
          >
            Extract from Pasted Text
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={() => setMode(mode === 'file' ? 'paste' : 'file')}
        className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <FileText className="h-4 w-4" />
        {mode === 'file' ? 'Paste Complaint Text / Email' : 'Upload a File Instead'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Supported formats: PDF, DOCX, TXT, EML · Max file size: 10MB
      </p>

      {extracting && (
        <div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${extractionProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Analyzing document content and extracting key details... {extractionProgress}%
          </p>
        </div>
      )}
    </div>
  )
}
