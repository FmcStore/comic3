import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[180px] md:text-[240px] font-bold text-amber-500/20 leading-none">
            404
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="text-6xl md:text-8xl"
            >
              😵
            </motion.div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold mb-4">Halaman Tidak Ditemukan</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Sepertinya kamu tersesat di alam komik. Halaman yang kamu cari tidak ada atau telah dipindahkan.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <i className="fas fa-home"></i>
            Kembali ke Beranda
          </button>

          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-zinc-900 border border-white/10 rounded-2xl font-bold hover:border-amber-500/50 hover:bg-zinc-800 transition flex items-center justify-center gap-3"
          >
            <i className="fas fa-arrow-left"></i>
            Kembali Sebelumnya
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4">Mungkin Kamu Mencari:</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate('/ongoing')}
              className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
            >
              Komik Ongoing
            </button>
            <button
              onClick={() => navigate('/completed')}
              className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
            >
              Komik Selesai
            </button>
            <button
              onClick={() => navigate('/bookmarks')}
              className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
            >
              Bookmark
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition"
            >
              Riwayat
            </button>
          </div>
        </div>

        {/* Easter Egg */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl"
        >
          <p className="text-sm">
            <i className="fas fa-lightbulb text-amber-500 mr-2"></i>
            <strong>Tips:</strong> Gunakan fitur pencarian untuk menemukan komik yang kamu cari!
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFound
