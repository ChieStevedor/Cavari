package com.cavari.voicenotes.recording

import java.io.File
import java.io.RandomAccessFile

/**
 * Streams 16-bit mono PCM samples into a valid WAV file. The header sizes
 * aren't known until the last sample is written, so a 44-byte placeholder
 * is written up front and patched in place once [finish] is called.
 */
class WavFileWriter(private val file: File, private val sampleRate: Int) {

    private val raf = RandomAccessFile(file, "rw")
    private var dataBytesWritten = 0L

    init {
        raf.write(ByteArray(HEADER_SIZE))
    }

    fun write(buffer: ByteArray, offset: Int, length: Int) {
        raf.write(buffer, offset, length)
        dataBytesWritten += length
    }

    /** Patches the header with final sizes, closes the file, and returns it. */
    fun finish(): File {
        raf.seek(0)
        raf.write(buildHeader(dataBytesWritten))
        raf.close()
        return file
    }

    private fun buildHeader(dataSize: Long): ByteArray {
        val byteRate = sampleRate * CHANNELS * (BITS_PER_SAMPLE / 8)
        val blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8)
        val header = ByteArray(HEADER_SIZE)

        fun putInt(offset: Int, value: Int) {
            header[offset] = (value and 0xff).toByte()
            header[offset + 1] = ((value shr 8) and 0xff).toByte()
            header[offset + 2] = ((value shr 16) and 0xff).toByte()
            header[offset + 3] = ((value shr 24) and 0xff).toByte()
        }
        fun putShort(offset: Int, value: Int) {
            header[offset] = (value and 0xff).toByte()
            header[offset + 1] = ((value shr 8) and 0xff).toByte()
        }

        "RIFF".toByteArray().copyInto(header, 0)
        putInt(4, (36 + dataSize).toInt())
        "WAVE".toByteArray().copyInto(header, 8)
        "fmt ".toByteArray().copyInto(header, 12)
        putInt(16, 16)
        putShort(20, 1) // PCM
        putShort(22, CHANNELS)
        putInt(24, sampleRate)
        putInt(28, byteRate)
        putShort(32, blockAlign)
        putShort(34, BITS_PER_SAMPLE)
        "data".toByteArray().copyInto(header, 36)
        putInt(40, dataSize.toInt())
        return header
    }

    companion object {
        private const val HEADER_SIZE = 44
        private const val CHANNELS = 1
        private const val BITS_PER_SAMPLE = 16
    }
}
