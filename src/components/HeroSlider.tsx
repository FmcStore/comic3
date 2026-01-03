import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import { Comic } from '../utils/api'

interface HeroSliderProps {
  comics: Comic[]
  onComicClick: (comic: Comic) => void
}

const HeroSlider: React.FC<HeroSliderProps> = ({ comics, onComicClick }) => {
  if (comics.length === 0) return null

  return (
    <div className="relative rounded-3xl overflow-hidden">
      <Swiper
        modules={[Navigation, Autoplay, EffectFade]}
        navigation
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop
        speed={800}
        className="rounded-3xl"
      >
        {comics.map((comic, index) => (
          <SwiperSlide key={index}>
            <div 
              className="relative h-[400px] md:h-[500px] cursor-pointer"
              onClick={() => onComicClick(comic)}
            >
              {/* Background Image with Gradient */}
              <div className="absolute inset-0">
                <img
                  src={comic.image}
                  alt={comic.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-full flex items-end p-8">
                <div className="max-w-3xl">
                  {/* Type Badge */}
                  <span className="inline-block px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-full mb-4">
                    {comic.type || 'Komik'}
                  </span>

                  {/* Title */}
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {comic.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-300 text-lg mb-6 line-clamp-2">
                    {comic.latestChapter || 'Baca sekarang'}
                  </p>

                  {/* Button */}
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onComicClick(comic)
                      }}
                      className="px-8 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-600 transition-all hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Baca Sekarang
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onComicClick(comic)
                      }}
                      className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold hover:bg-white/20 transition"
                    >
                      <i className="fas fa-info-circle mr-2"></i>
                      Detail
                    </button>
                  </div>
                </div>
              </div>

              {/* Chapter Info */}
              <div className="absolute bottom-8 right-8 bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {comic.latestChapter?.match(/\d+/)?.[0] || '1'}
                  </div>
                  <div className="text-sm text-gray-300">Chapter</div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Pagination */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex gap-2">
          {comics.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/30"
            />
          ))}
        </div>
      </div>

      {/* Gradient Overlay Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  )
}

export default HeroSlider
