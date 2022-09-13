import { useCss, useDropArea, usePrevious, usePreviousDistinct } from 'react-use'
import { useImmer } from 'use-immer'
import uniqid from 'uniqid'
import { IconButton, Slider, ToggleButton, css } from '@mui/material'
import type { LottieRefCurrentProps } from 'lottie-react'
import Lottie from 'lottie-react'

interface UploadedLottie {
  id: string
  data: string
  name: string
}

export default function App() {
  const [lotties, setLotties] = useImmer<UploadedLottie[]>([])

  const [activeLottieId, setActiveLottieId] = useState<string>()

  const [activeLottie, setActiveLottie] = useState<UploadedLottie>()

  const [animationData, setAnimationData] = useState<object>()

  const lottieRef = useRef<LottieRefCurrentProps>(null)

  const [playing, setPlaying] = useState<boolean>()
  const prevPlaying = usePreviousDistinct(playing)

  useEffect(() => {
    if (activeLottie) {
      setPlaying(true)
      setAnimationData(JSON.parse(activeLottie.data))
    }
  }, [activeLottie, setAnimationData])

  useEffect(() => {
    if (!prevPlaying && prevPlaying === false && playing)
      lottieRef.current?.play()

    if (prevPlaying && prevPlaying === true && !playing)
      lottieRef.current?.pause()
  }, [prevPlaying, playing])

  const [speed, setSpeed] = useState<number>(1)

  const [lastFrame, setLastFrame] = useState<number>(0)

  const prevSpeed = usePreviousDistinct(speed)

  useEffect(() => {
    if (prevSpeed && speed !== prevSpeed)
      lottieRef.current?.setSpeed(speed)
  }, [speed, prevSpeed])

  const [lottieDuration, setLottieDuration] = useState<number>()

  useEffect(() => {
    const newLottie = lotties.find(lottie => lottie.id === activeLottieId)
    setActiveLottie(newLottie)
  }, [lotties, activeLottieId, setActiveLottie])

  const [dropBond] = useDropArea({
    onFiles: (files) => {
      files
        .filter(file => file.type === 'application/json')
        .forEach(async (file) => {
          const data = await file.text()
          setLotties((draft) => {
            const currentIndex = draft.findIndex(lottie => lottie.name === file.name)
            if (currentIndex === -1)
              draft.push({ data, name: file.name, id: uniqid() })

            else
              draft[currentIndex] = { data, name: file.name, id: uniqid() }
          })
        })
    },
  })

  const [cssString, setCssString] = useState(
`.lottie-primary {
  fill: var(--primary-colour);
}
.lottie-secondary {
  fill: var(--secondary-colour);
}`)

  const styleRef = useRef<HTMLStyleElement>()

  useEffect(() => {
    if (!styleRef.current) {
      const styleTag = document.createElement('style') as HTMLStyleElement
      styleTag.id = 'customStyleId'
      styleTag.type = 'text/css'
      document.head.appendChild(styleTag)
      styleRef.current = styleTag
    }
  }, [])

  useEffect(() => {
    if (styleRef.current)
      styleRef.current.innerText = cssString
  }, [styleRef, cssString])

  return (
    <main className="h-screen w-screen bg-white text-dark-900 grid grid-rows-[1fr_250px]">
      <div className="max-w-full min-h-0 min-w-0 flex flex-col items-stretch">
        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow min-h-0 flex flex-col items-center">
            {activeLottie
              ? (
                <>
                  <Lottie
                    lottieRef={lottieRef}
                    className="min-h-0"
                    animationData={animationData}
                    onEnterFrame={(event) => {
                      const frame = event.currentTime
                      // console.log(frame)
                      setLottieDuration(lottieRef.current?.getDuration(true))
                      setLastFrame(Math.round(frame as number))
                    }}
                  />
                  <div className="w-full p-4 max-w-100">
                    <Slider
                      value={lastFrame}
                      max={lottieDuration}
                      valueLabelDisplay="on"
                      onChange={(_, value) => {
                        lottieRef.current?.goToAndStop(value as number, true)
                        setPlaying(false)
                      }}
                      color="secondary"
                      sx={{
                        '& .MuiSlider-track': {
                          transition: 'none',
                        },

                        '& .MuiSlider-thumb': {
                          transition: 'none',
                        },
                      }}
                    />
                  </div>
                </>
                )
              : null}
          </div>
          <div className="h-20 flex-shrink-0 mx-4 border-t border-t-gray-200 flex justify-center items-center gap-4">
            <IconButton
              onClick={() => {
                setPlaying(current => !current)
              }}
            >
              {playing ? (<div className="i-carbon-pause-filled" />) : (<div className="i-carbon-play-filled-alt" />)}
            </IconButton>
            <div className="w-50 px-6">
              Speed
              <Slider
                value={speed}
                onChange={(_, value) => {
                  setSpeed(value as number)
                }}
                valueLabelDisplay="auto"
                min={0}
                max={3}
                step={0.1}
              />
            </div>
          </div>
        </div>
        <div className="h-40 flex-shrink-0 flex min-w-0 items-stretch overflow-hidden">
          <div {...dropBond} className="w-40 flex-shrink-0 grid place-items-center bg-light-300 text-gray-400 shadow-inner shadow-light-800">
            <div className="text-center">
              <span>Drop files here</span><br />
              <div className="inline-block i-carbon-cloud-upload"></div>
            </div>
          </div>
          <div className="flex-grow min-w-0 overflow-x-auto flex items-stretch border border-light-900 bg-light-500">
            {lotties.map(lottie => (
              <div
                key={lottie.id}
                className="flex-shrink-0 w-40 p-2 bg-white not-first:( border-r border-r-light-900 ) flex flex-col items-center gap-2"
              >
                <div className="text-center">{lottie.name}</div>
                <div>
                  <ToggleButton
                    value="check"
                    selected={activeLottieId === lottie.id}
                    onChange={() => {
                      setActiveLottieId(activeLottieId === lottie.id ? undefined : lottie.id)
                    }}
                    >{activeLottieId === lottie.id ? 'Playing' : 'Play'}</ToggleButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-dark-100">
        <textarea
          className="text-white font-mono h-full w-full bg-transparent"
          value={cssString}
          onChange={(event) => { setCssString(event.target.value) }}
        ></textarea>
      </div>
    </main>
  )
}

