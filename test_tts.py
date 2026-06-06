import asyncio
import edge_tts

async def main():
    text = "Les CEO les plus puissants du monde ne travaillent pas plus que vous. Ils travaillent différemment."
    voice = "fr-FR-DeniseNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save("voix.mp3")

asyncio.run(main())
 
