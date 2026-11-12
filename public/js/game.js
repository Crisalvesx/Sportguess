// Controla a partida: envia palpites ao servidor e atualiza blur, pontuação e resposta.
(() => {
  const root = document.getElementById('game')
  if (!root) return

  const $ = (id) => document.getElementById(id)
  const csrf = root.dataset.csrf
  const state = { done: root.dataset.done === 'true', last: root.dataset.last === 'true' }

  async function post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrf,
      },
      body: JSON.stringify(body || {}),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Algo deu errado. Tente de novo.')
    return data
  }

  function setBlur(px) {
    $('video').style.filter = `blur(${px}px)`
    $('blurtag').textContent = `● Blur: ${px}px`
  }

  function setMsg(text, ok) {
    const el = $('msg')
    el.textContent = text
    el.className = 'fw-semibold mt-3 ' + (ok ? 'text-success' : 'text-danger')
  }

  function updateButton() {
    $('btn').textContent = state.done ? (state.last ? 'Ver resultado' : 'Próxima →') : 'Confirmar ➤'
    $('guess').disabled = state.done
  }

  function showAnswer(athlete) {
    if (!athlete) return
    $('answerName').textContent = athlete.name
    const photo = $('answerPhoto')
    if (athlete.photoUrl) {
      photo.src = athlete.photoUrl
      photo.hidden = false
    } else {
      photo.hidden = true
    }
    $('answer').hidden = false
  }

  async function sendGuess() {
    const guess = $('guess').value.trim()
    if (guess.length < 2) return setMsg('Digite pelo menos 2 letras.', false)

    const r = await post('/jogar/palpite', { guess })
    state.done = r.done
    state.last = r.isLast
    setBlur(r.blur)
    $('tries').textContent = r.tries
    $('score').textContent = r.score
    $('guess').value = ''

    if (r.correct) {
      setMsg(`Acertou! +${r.gained} pontos`, true)
    } else if (r.done) {
      setMsg('Acabaram as tentativas.', false)
    } else {
      setMsg('Errou. O vídeo ficou mais nítido, tente de novo.', false)
    }
    showAnswer(r.athlete)
    updateButton()
    if (!state.done) $('guess').focus()
  }

  async function nextRound() {
    const r = await post('/jogar/proxima')
    if (r.finished) {
      window.location.href = r.redirect
      return
    }
    state.done = false
    state.last = r.isLast
    $('video').src = r.videoUrl
    $('video').play().catch(() => {})
    setBlur(r.blur)
    $('tries').textContent = r.tries
    $('score').textContent = r.score
    $('round').textContent = $('round').textContent.replace(/Rodada \d+ \/ \d+/, `Rodada ${r.round} / ${r.total}`)
    $('answer').hidden = true
    setMsg('', true)
    updateButton()
    $('guess').focus()
  }

  $('guessForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    $('btn').disabled = true
    try {
      if (state.done) await nextRound()
      else await sendGuess()
    } catch (err) {
      setMsg(err.message, false)
    } finally {
      $('btn').disabled = false
    }
  })

  if (!state.done) $('guess').focus()
})()
