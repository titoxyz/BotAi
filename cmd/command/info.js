import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import os from 'os'

export default function info(ev) {
  ev.on({
    name: 'afk',
    cmd: ['afk'],
    tags: 'Info Menu',
    desc: 'menandai kamu afk',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const user = Object.values(db().key).find(u => u.jid === chat.sender),
              reason = args.join(' ') || 'tidak ada alasan',
              time = global.time.timeIndo('Asia/Jakarta', 'DD-MM HH:mm:ss')

        if (!user) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar, ulangi' }, { quoted: m })

        user.afk.status = !0
        user.afk.reason = reason
        user.afk.afkStart = time 
        save.db()

        await xp.sendMessage(chat.id, { text: `Kamu memulai afk\ndengan alasan: ${reason}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
ev.on({
  name: 'cekgempa',
  cmd: ['cekgempa', 'gempa'],
  tags: 'Info Menu',
  desc: 'info gempa terkini di Indonesia',
  owner: !1,
  prefix: !0,
  money: 100,
  exp: 0.1,

  run: async (xp, m, {
    chat,
    cmd,
    prefix
  }) => {
    try {
      await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
      
      // API BMKG untuk gempa terbaru
      const gempaUrl = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'
      // API BMKG untuk 15 gempa terakhir (opsional)
      const gempaTerkiniUrl = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json'
      
      let gempaData
      try {
        const response = await fetch(gempaUrl)
        const data = await response.json()
        
        if (!data.Infogempa || !data.Infogempa.gempa) {
          throw new Error('Data gempa tidak ditemukan')
        }
        
        gempaData = data.Infogempa.gempa
      } catch (error) {
        console.error('Error fetching earthquake data:', error)
        // Fallback ke API alternatif
        try {
          const response = await fetch('https://api.banghasan.com/sholat/format/json/gempa')
          const data = await response.json()
          
          if (data.gempa) {
            gempaData = {
              Tanggal: data.gempa.Tanggal || 'Data tidak tersedia',
              Jam: data.gempa.Jam || 'Data tidak tersedia',
              DateTime: `${data.gempa.Tanggal} ${data.gempa.Jam}`,
              Coordinates: `${data.gempa.Lintang}, ${data.gempa.Bujur}`,
              Lintang: data.gempa.Lintang || 'Data tidak tersedia',
              Bujur: data.gempa.Bujur || 'Data tidak tersedia',
              Magnitude: data.gempa.Magnitude || 'Data tidak tersedia',
              Kedalaman: data.gempa.Kedalaman || 'Data tidak tersedia',
              Wilayah: data.gempa.Wilayah || 'Data tidak tersedia',
              Potensi: data.gempa.Potensi || 'Data tidak tersedia',
              Dirasakan: data.gempa.Dirasakan || '-'
            }
          } else {
            throw new Error('Data gempa tidak ditemukan dari API alternatif')
          }
        } catch (fallbackError) {
          return xp.sendMessage(chat.id, { 
            text: '⚠️ Gagal mengambil data gempa. Silakan coba beberapa saat lagi.\n\nAtau kunjungi situs BMKG: https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg' 
          }, { quoted: m })
        }
      }
      
      // Format pesan
      let txt = `${head}${opb} ⚠️ *INFO GEMPA TERKINI* ${clb}\n\n`
      txt += `${body} ${btn} *Tanggal:* ${gempaData.Tanggal || '-'}\n`
      txt += `${body} ${btn} *Jam:* ${gempaData.Jam || '-'}\n`
      txt += `${body} ${btn} *Magnitude:* ${gempaData.Magnitude || '-'}\n`
      txt += `${body} ${btn} *Kedalaman:* ${gempaData.Kedalaman || '-'}\n`
      txt += `${body} ${btn} *Koordinat:* ${gempaData.Coordinates || gempaData.Lintang || '-'} ${gempaData.Bujur || ''}\n`
      txt += `${body} ${btn} *Lokasi:* ${gempaData.Wilayah || '-'}\n`
      txt += `${body} ${btn} *Potensi Tsunami:* ${gempaData.Potensi || 'Tidak berpotensi'}\n`
      
      // Tambahkan info dirasakan jika ada
      if (gempaData.Dirasakan && gempaData.Dirasakan !== '-') {
        txt += `${body} ${btn} *Dirasakan:* ${gempaData.Dirasakan}\n`
      }
      
      txt += `\n${foot}${line}\n`
      txt += `💡 *Tips Keselamatan Gempa:*\n`
      txt += `• Tetap tenang dan jangan panik\n`
      txt += `• Berlindung di bawah meja yang kuat\n`
      txt += `• Jauhi kaca, jendela, dan benda tergantung\n`
      txt += `• Jika di luar, jauhi bangunan dan tiang\n`
      txt += `• Ikuti informasi resmi dari BMKG\n\n`
      txt += `${head}${opb} *Sumber Data: BMKG* ${clb}\n`
      txt += `Update real-time setiap terjadi gempa`
      
      // Kirim pesan dengan thumbnail yang relevan
      const thumbnail = 'https://img.icons8.com/color/96/000000/earthquake.png'
      
      await xp.sendMessage(chat.id, {
        text: txt,
        contextInfo: {
          externalAdReply: {
            title: '🌍 Info Gempa Terkini',
            body: `Gempa ${gempaData.Magnitude || '?'} SR di ${gempaData.Wilayah?.split(' ').slice(-3).join(' ') || 'Indonesia'}`,
            thumbnailUrl: thumbnail,
            mediaType: 1,
            renderLargerThumbnail: !0
          },
          forwardingScore: 1,
          isForwarded: !0,
          forwardedNewsletterMessageInfo: {
            newsletterJid: idCh
          }
        }
      }, { quoted: m })
      
      // Opsional: Kirim info 15 gempa terakhir
      try {
        const responseTerkini = await fetch(gempaTerkiniUrl)
        const dataTerkini = await responseTerkini.json()
        
        if (dataTerkini.Infogempa && Array.isArray(dataTerkini.Infogempa.gempa) && dataTerkini.Infogempa.gempa.length > 0) {
          const recentQuakes = dataTerkini.Infogempa.gempa.slice(0, 5) // Ambil 5 gempa terbaru
          let recentTxt = `${head}${opb} 📊 *5 GEMPA TERAKHIR* ${clb}\n\n`
          
          recentQuakes.forEach((quake, index) => {
            recentTxt += `${index + 1}. *${quake.Magnitude} SR* - ${quake.Wilayah?.substring(0, 30)}${quake.Wilayah?.length > 30 ? '...' : ''}\n`
            recentTxt += `   ⏰ ${quake.Jam} | 📍 ${quake.Kedalaman}\n\n`
          })
          
          recentTxt += `${foot}${line}\nGunakan ${prefix}${cmd} untuk info terupdate`
          
          // Tunggu 1 detik sebelum mengirim gempa terakhir
          await new Promise(resolve => setTimeout(resolve, 1000))
          await xp.sendMessage(chat.id, { text: recentTxt }, { quoted: m })
        }
      } catch (error) {
        // Skip jika gagal mengambil data gempa terakhir
        console.log('Info gempa terakhir tidak dikirim:', error.message)
      }
      
    } catch (e) {
      err(`error pada ${cmd}`, e)
      call(xp, e, m)
    }
  }
})

// Tambahan fitur untuk gempa dengan parameter wilayah
ev.on({
  name: 'infogempa',
  cmd: ['infogempa'],
  tags: 'Info Menu',
  desc: 'info gempa dengan detail lebih lengkap',
  owner: !1,
  prefix: !0,
  money: 150,
  exp: 0.2,

  run: async (xp, m, {
    args,
    chat,
    cmd,
    prefix
  }) => {
    try {
      const wilayah = args.join(' ')?.toLowerCase()
      
      if (wilayah === 'global') {
        // Fitur untuk gempa global dari USGS
        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })
        
        const usgsUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5&limit=5'
        
        try {
          const response = await fetch(usgsUrl)
          const data = await response.json()
          
          if (!data.features || data.features.length === 0) {
            return xp.sendMessage(chat.id, { 
              text: '⚠️ Tidak ada data gempa global dengan magnitude > 5 SR dalam 24 jam terakhir.' 
            }, { quoted: m })
          }
          
          let txt = `${head}${opb} 🌎 *GEMPA GLOBAL* ${clb}\n`
          txt += `${body} Data dari USGS (24 jam terakhir)\n\n`
          
          data.features.slice(0, 5).forEach((quake, index) => {
            const props = quake.properties
            const place = props.place || 'Lokasi tidak diketahui'
            const mag = props.mag || '?'
            const time = new Date(props.time).toLocaleTimeString('id-ID', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Asia/Jakarta'
            })
            
            txt += `${index + 1}. *${mag} SR* - ${place.substring(0, 40)}${place.length > 40 ? '...' : ''}\n`
            txt += `   ⏰ ${time} WIB | 📍 ${props.tsunami === 1 ? '⚠️ Berpotensi Tsunami' : 'Tidak berpotensi'}\n\n`
          })
          
          txt += `${foot}${line}\n`
          txt += `ℹ️ Gunakan ${prefix}cekgempa untuk info gempa Indonesia`
          
          await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
          
        } catch (error) {
          return xp.sendMessage(chat.id, { 
            text: '⚠️ Gagal mengambil data gempa global. Silakan coba lagi nanti.' 
          }, { quoted: m })
        }
        
      } else if (wilayah) {
        // Filter gempa berdasarkan wilayah (simulasi dengan data dari API)
        await xp.sendMessage(chat.id, { 
          text: `🔍 Mencari info gempa di wilayah "${wilayah}"...\n\nFitur pencarian berdasarkan wilayah masih dalam pengembangan. Untuk saat ini gunakan ${prefix}cekgempa untuk info gempa terkini di Indonesia.` 
        }, { quoted: m })
        
      } else {
        // Default: tampilkan info seperti cekgempa
        await xp.sendMessage(chat.id, { 
          text: `Contoh penggunaan:\n• ${prefix}infogempa global - untuk gempa dunia\n• ${prefix}infogempa jawa - untuk gempa di Jawa (soon)\n\nAtau gunakan ${prefix}cekgempa untuk info gempa terkini di Indonesia` 
        }, { quoted: m })
      }
      
    } catch (e) {
      err(`error pada ${cmd}`, e)
      call(xp, e, m)
    }
  }
})
  ev.on({
    name: 'cekcuaca',
    cmd: ['cekcuaca', 'cuaca'],
    tags: 'Info Menu',
    desc: 'info saluran cuaca',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const kota = args.join(' ')
        if (!kota) return xp.sendMessage(chat.id, { text: `contoh: ${prefix}${cmd} jakarta` }, { quoted: m })

        const url = await fetch(`https://api.ureshii.my.id/api/internet/info-cuaca?kota=${encodeURIComponent(kota)}`),
              res = await url.json()

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        if (!res.kota || !res.cuaca) return xp.sendMessage(chat.id, { text: `gagal mendapatkan info cuaca untuk kota: ${kota}` }, { quoted: m })

        let txt = '*Cuaca Hari Ini Di*\n\n'
            txt += `${head}${opb} ${res.kota}, ${res.negara} ${clb}\n`
            txt += `${body} ${btn} *Cuaca:* ${res.cuaca}\n`
            txt += `${body} ${btn} *Kelembapan:* ${res.kelembapan}%\n`
            txt += `${body} ${btn} *Kec Angin:* ${res.angin_kpj} m/s\n`
            txt += `${body} ${btn} *Suhu Saat Ini:* ${res.suhu_c}°\n`
            txt += `${body} ${btn} *Suhu Tertinggi:* ${res.suhu_tertinggi_c}°\n`
            txt += `${body} ${btn} *Suhu Terendah:* ${res.suhu_terendah_c}°\n`
            txt += `${foot}${line}\n`
            txt += 'Semoga harimu menyenangkan! Jangan lupa bawa payung kalau cuacanya mendung ya! ☂'

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cekgc',
    cmd: ['cekgc'],
    tags: 'Info Menu',
    desc: 'mengecek status grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const gcData = getGc(chat),
              metadata = groupCache.get(chat.id),
              name = metadata.subject,
              member = metadata.participants.length,
              { usrAdm, botAdm } = await grupify(xp, m),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg'

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa digunakan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        let txt = `${head} ${opb} *Informasi Grup* ${clb}\n`
            txt += `${body} ${btn} *Nama: ${name}*\n`
            txt += `${body} ${btn} *Id: ${gcData?.id}*\n`
            txt += `${body} ${btn} *Diban: ${gcData?.ban ? 'Iya' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Member: ${gcData?.member}*\n`
            txt += `${foot}${line}\n`
            txt += `${head}${opb} *Pengaturan Grup* ${clb}\n`
            txt += `${body} ${btn} *Anti Ch: ${gcData?.filter?.antich ? 'Aktif' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Anti Badword: ${gcData?.filter?.badword?.antibadword ? 'Aktif' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Anti Link: ${gcData?.filter?.antilink ? 'Aktif' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Anti TagSw: ${gcData?.filter?.antitagsw ? 'Aktif' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Leave: ${gcData?.filter?.left?.leftGc ? 'Aktif' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Welcome: ${gcData?.filter?.welcome?.welcomeGc ? 'Aktif' : 'Tidak'}*\n`
            txt += `${foot}${line}\n`
            txt += `${head}${opb} *Blacklist Kata* ${clb}\n`
            txt += `${body} ${btn} *Kata: ${gcData?.filter?.badword?.badwordtext || '-'}*\n`
            txt += `${foot}${line}`

        let thumb = await xp.profilePictureUrl(metadata.id, 'image') || defThumb,
            oldName = name,
            newName = metadata.subject

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `Ini adalah informasi grup ${name}`,
              thumbnailUrl: thumb,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        })

        if (gcData.member === metadata?.participants.length) {
          return
        }
        gcData.member = metadata.participants.length
        save.gc()

        if (oldName !== newName) {
          gc().key[newName] = gc().key[oldName]
          delete gc().key[oldName]
          save.gc()
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'help',
    cmd: ['help'],
    tags: 'Info Menu',
    desc: 'informasi fitur',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = args[0]?.toLowerCase(),
              cmdFile = path.join(process.cwd(), 'cmd', 'command')

        if (!text) return xp.sendMessage(chat.id, { text: `gunakan:\n${prefix}${cmd} menu` }, { quoted: m })

        const files = fs.readdirSync(cmdFile).filter(f => f.endsWith('.js'))
        let found = null

        for (const file of files) {
          const event = (await import (`file://${path.join(cmdFile, file)}`)).default
          if (typeof event !== 'function') continue

          event({
            on: obj => {
              const name = obj?.name?.toLowerCase(),
                    cmds = Array.isArray(obj?.cmd) ? obj.cmd.map(v => v.toLowerCase()) : []

              if (name === text || cmds.includes(text)) {
                found = obj
              }
            }
          })

          if (found) break
        }

        if (!found) {
          return xp.sendMessage(chat.id, { text: `fitur ${text} tidak ada` }, { quoted: m })
        }

        let txt = `${head} ${opb} *I N F O R M A S I* ${clb}\n`
            txt += `${body} ${btn} *Nama: ${found.name || '-'}*\n`
            txt += `${body} ${btn} *Cmd: ${Array.isArray(found.cmd) ? found.cmd.map(c => '.' + c).join(', ') : '-'}*\n`
            txt += `${body} ${btn} *Tags: ${found.tags || '-'}*\n`
            txt += `${body} ${btn} *Deskripsi: ${found.desc || '-'}*\n`
            txt += `${body} ${btn} *Owner Only: ${found.owner ? 'Ya' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Prefix: ${found.prefix ? 'Ya' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Pajak: Rp ${found.money.toLocaleString('id-ID') || 0}*\n`
            txt += `${body} ${btn} *Exp: ${found.exp || 0.1}*\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `informasi fitur ${found.name}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0,
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'menu',
    cmd: ['menu'],
    tags: 'Info Menu',
    desc: 'main Menu',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
              filterTag = args[0]?.toLowerCase(),
              cmds = ev.cmd || [],
              name = chat.pushName,
              commands = {},
              allUsr = Object.keys(db().key).length

        for (const c of cmds) {
          const tag = c.tags || 'Other',
                name = c.name || (Array.isArray(c.cmd) ? c.cmd[0] : c.cmd)
          commands[tag] ??= []
          name && commands[tag].push(name)
        }

        const allCmd = Object.values(commands).reduce((a, b) => a + b.length, 0)

        let txt =
          `Halo *${name}*, Saya adalah asisten virtual.\n\n` +
          `${head}${opb} *${botName}* ${clb}\n` +
          `${body} ${btn} *Bot Name: ${botFullName}*\n` +
          `${body} ${btn} *Owner: ${ownerName}*\n` +
          `${body} ${btn} *Waktu: ${time}*\n` +
          `${body} ${btn} *All Cmd: ${allCmd}*\n` +
          `${body} ${btn} *Total User: ${allUsr}*\n` +
          `${foot}${line}\n${readmore}\n`

        const entries = (filterTag
          ? Object.entries(commands).filter(([cat]) => cat.toLowerCase().includes(filterTag))
          : Object.entries(commands)
        ).sort(([a], [b]) => a.localeCompare(b))

        !entries.length
          ? txt += `${body} Tag *${filterTag}* tidak ditemukan!\n`
          : entries.forEach(([cat, features]) => {
              features.length &&
              (txt +=
                `${head}${opb} *${cat.charAt(0).toUpperCase() + cat.slice(1)}* ${clb}\n` +
                features.map(f => `${body} ${btn} *${f}*`).join('\n') +
                `\n${foot}${line}\n\n`)
            })

        txt += `${footer}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `Ini adalah menu ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        }, { quoted: m })

      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'owner',
    cmd: ['owner',  'contact'],
    tags: 'Info Menu',
    desc: 'menampilkan kontak owner',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const owner = global.ownerName || 'error',
              bot = global.botName || 'error',
              ownerNumber = Array.isArray(global.ownerNumber) ? global.ownerNumber : [global.ownerNumber]

        if (!ownerNumber || !ownerNumber.length) return xp.sendMessage(chat.id, { text: 'tidak ada kontak owner' }, { quoted: m })

        const contact = ownerNumber.map((num, i) => ({ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${owner} ${i + 1}\nTEL;type=CELL;waid=${num}:${num}\nEND:VCARD` })),
              displayName = ownerNumber.length > 1 ? `${owner} dan ${ownerNumber.length - 1} lainnya` : owner

        await xp.sendMessage(chat.id, { contacts: { displayName, contacts: contact } }, { quoted: m })
        await xp.sendMessage(chat.id, { text: 'ini adalah kontak owner ku' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'profile',
    cmd: ['profile', 'me'],
    tags: 'Info Menu',
    desc: 'mengecek profile orang',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const data = Object.values(db().key).find(u => u.jid === chat.sender),
              base64 = v => Buffer.from(v).toString('base64'),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg',
              type = v => v ? 'Aktif' : 'Tidak'

        if (!data) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar, ulangi' }, { quoted: m })

        let thumb
        try { thumb = await xp.profilePictureUrl(chat.sender, 'image') }
        catch { thumb = defThumb }

        const name = chat.pushName || m.pushName,
              nomor = data.jid,
              noId = base64(data.noId),
              cmd = data.cmd,
              ban = type(data.ban),
              ai = type(data.ai?.bell),
              farm = type(data?.game?.farm),
              chatAi = data.ai.chat,
              role = data.ai.role,
              acc = data.acc,
              money = data.moneyDb?.money.toLocaleString('id-ID'),
              moneyInBank = data.moneyDb?.moneyInBank.toLocaleString('id-ID'),
              exp = data.exp || 0,
              level = ((exp + 10) / 10).toFixed(1)

        let txt = `${head} ${opb} *P R O F I L E* ${clb}\n`
            txt += `${body} ${btn} *Nama:* ${name}\n`
            txt += `${body} ${btn} *Nomor:* ${nomor}\n`
            txt += `${body} ${btn} *No ID:* ${noId}\n`
            txt += `${body} ${btn} *Cmd:* ${cmd}\n`
            txt += `${body} ${btn} *Ban:* ${ban}\n`
            txt += `${body} ${btn} *Acc:* ${acc}\n`
            txt += `${foot}${line}\n\n`
            txt += `${head} ${opb} *G A M E* ${clb}\n`
            txt += `${body} ${btn} *Money:* Rp ${money}\n`
            txt += `${body} ${btn} *Uang Di Bank:* Rp ${moneyInBank}\n`
            txt += `${body} ${btn} *Level:* ${level}\n`
            txt += `${body} ${btn} *Auto Farm:* ${farm}\n`
            txt += `${foot}${line}\n\n`
            txt += `${head} ${opb} *A I* ${clb}\n`
            txt += `${body} ${btn} *Ai:* ${ai}\n`
            txt += `${body} ${btn} *Chat Ai:* ${chatAi}\n`
            txt += `${body} ${btn} *Role:* ${role}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `ini profile ${name}`,
              thumbnailUrl: thumb,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'stats',
    cmd: ['st', 'stats', 'ping'],
    tags: 'Info Menu',
    desc: 'status Bot',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const a = performance.now(),
              bytes = b => (b / 1024 / 1024).toFixed(2),
              time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
              cpu = os.cpus()?.[0]?.model ?? 'Tidak diketahui',
              platform = os.platform(),
              arch = os.arch(),
              totalMem = os.totalmem(),
              usedMem = totalMem - os.freemem()

        let totalDisk = 'Tidak diketahui',
            usedDisk = 'Tidak diketahui',
            freeDisk = 'Tidak diketahui'

        try {
          const d = execSync('df -h /', { encoding: 'utf8' })
            .split('\n')[1]
            .split(/\s+/)
          ;[totalDisk, usedDisk, freeDisk] = [d[1], d[2], d[3]]
        } catch (e) {
          err('Disk info error:', e.message)
        }

        const stats = `Ini adalah status dari ${botName}

    ${head} ${opb} Stats *${botName}* ${clb}
    ${body} ${btn} *Bot Name:* ${botName}
    ${body} ${btn} *Bot Full Name:* ${botFullName}
    ${body} ${btn} *Time:* ${time}
    ${body} ${btn} *Respon:* ${(performance.now() - a).toFixed(2)} ms
    ${foot}${line}

    ${head} ${opb} Stats System ${clb}
    ${body} ${btn} *Platform:* ${platform} ( ${arch} )
    ${body} ${btn} *Cpu:* ${cpu}
    ${body} ${btn} *Ram:* ${bytes(usedMem)} MB / ${bytes(totalMem)} MB
    ${body} ${btn} *Storage:* ${usedDisk} / ${totalDisk} ( ${freeDisk} )
    ${foot}${line}`.trim()

        await xp.sendMessage(chat.id, {
          text: stats,
          contextInfo: {
            externalAdReply: {
              title: botFullName,
              body: `Ini adalah stats ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
    ev.on({
    name: 'cekweb',
    cmd: ['cekweb', 'ceksite'],
    tags: 'Info Menu',
    desc: 'Cek status website dengan detail lengkap',
    owner: !1,
    prefix: !0,
    money: 200,
    exp: 0.2,

    run: async (xp, m, { args, chat, cmd, prefix }) => {
        try {
            let url = args.join(' ')
            if (!url) return xp.sendMessage(chat.id, {
                text: `*Contoh:*\n${prefix}${cmd} google.com\n${prefix}${cmd} https://github.com\n\n*Opsi:*\n${prefix}${cmd} github.com mobile → versi mobile`
            }, { quoted: m })

            const params = url.toLowerCase().split(' ')
            const isMobile = params.includes('mobile')
            const originalUrl = params[0]
            
            let targetUrl = originalUrl
            if (!targetUrl.startsWith('http')) {
                targetUrl = 'https://' + targetUrl
            }

            await xp.sendMessage(chat.id, { react: { text: '🌐', key: m.key } })
            const startTime = Date.now()

            let websiteInfo = {
                url: targetUrl,
                status: 0,
                responseTime: 0,
                online: false,
                error: null
            }

            try {
                // 1. Cek koneksi website
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000)

                const response = await fetch(targetUrl, {
                    method: 'HEAD',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': isMobile 
                            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    redirect: 'follow'
                })

                clearTimeout(timeoutId)
                
                websiteInfo.responseTime = Date.now() - startTime
                websiteInfo.status = response.status
                websiteInfo.online = response.ok
                websiteInfo.ssl = targetUrl.startsWith('https')

                // Template variables
                const head = '┌──'
                const opb = '「'
                const clb = '」'
                const body = '│'
                const btn = '•'
                const foot = '└──'
                const line = '────────'

                // 3. Kirim status
                let statusEmoji = websiteInfo.online ? '✅' : '⚠️'
                let statusText = websiteInfo.online ? 'ONLINE' : 'ERROR'
                
                let txt = `${statusEmoji} *WEBSITE STATUS*\n\n`
                txt += `${head}${opb} Informasi Website ${clb}\n`
                txt += `${body} ${btn} *URL:* ${websiteInfo.url}\n`
                txt += `${body} ${btn} *Status:* ${statusText} (${websiteInfo.status})\n`
                txt += `${body} ${btn} *Response:* ${websiteInfo.responseTime}ms\n`
                txt += `${body} ${btn} *SSL:* ${websiteInfo.ssl ? '✅' : '❌'}\n`
                txt += `${body} ${btn} *View:* ${isMobile ? '📱 Mobile' : '💻 Desktop'}\n`
                
                if (response.headers.get('server')) {
                    txt += `${body} ${btn} *Server:* ${response.headers.get('server')}\n`
                }
                
                if (response.headers.get('content-type')) {
                    txt += `${body} ${btn} *Content-Type:* ${response.headers.get('content-type').split(';')[0]}\n`
                }
                
                txt += `${foot}${line}\n\n`
                
                // Info tambahan berdasarkan status
                if (websiteInfo.online) {
                    txt += `${head}${opb} Informasi Tambahan ${clb}\n`
                    txt += `${body} ${btn} Website dapat diakses dengan baik\n`
                    txt += `${body} ${btn} Waktu respon: ${websiteInfo.responseTime < 500 ? 'Cepat' : websiteInfo.responseTime < 2000 ? 'Sedang' : 'Lambat'}\n`
                    if (websiteInfo.ssl) {
                        txt += `${body} ${btn} Koneksi terenkripsi (HTTPS)\n`
                    }
                } else {
                    txt += `${head}${opb} Error Details ${clb}\n`
                    if (websiteInfo.status === 404) {
                        txt += `${body} ${btn} Halaman tidak ditemukan\n`
                        txt += `${body} ${btn} Coba periksa URL atau path\n`
                    } else if (websiteInfo.status === 403) {
                        txt += `${body} ${btn} Akses ditolak oleh server\n`
                        txt += `${body} ${btn} Website mungkin memblokir akses\n`
                    } else if (websiteInfo.status === 500) {
                        txt += `${body} ${btn} Server error internal\n`
                        txt += `${body} ${btn} Masalah di sisi server website\n`
                    } else if (websiteInfo.status === 502 || websiteInfo.status === 503 || websiteInfo.status === 504) {
                        txt += `${body} ${btn} Server sedang maintenance\n`
                        txt += `${body} ${btn} Coba lagi beberapa saat\n`
                    } else {
                        txt += `${body} ${btn} Website tidak merespon\n`
                        txt += `${body} ${btn} Kemungkinan down atau offline\n`
                    }
                }
                
                txt += `${foot}${line}\n\n`
                txt += `*Tips:*\n`
                txt += `• Cek URL dengan benar\n`
                txt += `• Pastikan website aktif\n`
                txt += `• Coba tanpa/ dengan www\n`
                txt += `${foot}${line}`

                await xp.sendMessage(chat.id, { text: txt }, { quoted: m })

            } catch (fetchError) {
                websiteInfo.error = fetchError.message
                websiteInfo.responseTime = Date.now() - startTime
                
                // Template variables
                const head = '┌──'
                const opb = '「'
                const clb = '」'
                const body = '│'
                const btn = '•'
                const foot = '└──'
                const line = '────────'
                
                let errorTxt = `❌ *GAGAL AKSES WEBSITE*\n\n`
                errorTxt += `${head}${opb} Error Details ${clb}\n`
                errorTxt += `${body} ${btn} *URL:* ${targetUrl}\n`
                errorTxt += `${body} ${btn} *Status:* OFFLINE\n`
                errorTxt += `${body} ${btn} *Waktu:* ${websiteInfo.responseTime}ms\n`
                
                if (fetchError.name === 'AbortError') {
                    errorTxt += `${body} ${btn} *Error:* Timeout (10 detik)\n`
                    errorTxt += `${body} ${btn} Website tidak merespon dalam waktu 10 detik\n`
                } else if (fetchError.code === 'ENOTFOUND') {
                    errorTxt += `${body} ${btn} *Error:* Domain tidak ditemukan\n`
                    errorTxt += `${body} ${btn} Periksa nama domain atau DNS\n`
                } else if (fetchError.code === 'ECONNREFUSED') {
                    errorTxt += `${body} ${btn} *Error:* Koneksi ditolak\n`
                    errorTxt += `${body} ${btn} Server menolak koneksi\n`
                } else {
                    errorTxt += `${body} ${btn} *Error:* ${fetchError.message || 'Tidak diketahui'}\n`
                }
                
                errorTxt += `${foot}${line}\n\n`
                errorTxt += `*Kemungkinan Penyebab:*\n`
                errorTxt += `${body} ${btn} Website sedang down\n`
                errorTxt += `${body} ${btn} Masalah koneksi internet\n`
                errorTxt += `${body} ${btn} Domain belum aktif\n`
                errorTxt += `${body} ${btn} Server overload\n`
                errorTxt += `${foot}${line}`
                
                await xp.sendMessage(chat.id, { text: errorTxt }, { quoted: m })
            }

        } catch (e) {
            console.error(`error pada ${cmd}`, e)
            xp.sendMessage(chat.id, { 
                text: `❌ Error: ${e.message || 'Gagal memproses'}` 
            }, { quoted: m })
        }
    }
})
}
