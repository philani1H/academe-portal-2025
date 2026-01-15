const cloudName =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    ((import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME as string)) ||
  "dszurpfhf"

const uploadPreset =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    ((import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET as string)) ||
  "ml_default"

/**
 * Upload image/video to Cloudinary
 * @param file File to upload
 * @param folder Optional folder name in Cloudinary
 * @param resourceType 'image' | 'video' | 'raw' | 'auto'
 * @returns Cloudinary response with secure_url
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "course-materials",
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<{
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  width?: number
  height?: number
  duration?: number
  bytes: number
}> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)
  formData.append("folder", folder)
  formData.append("resource_type", resourceType)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`)
  }

  return response.json()
}

export async function uploadVideoToCloudinary(
  file: File,
  folder: string = "course-videos",
): Promise<{
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  width?: number
  height?: number
  duration?: number
  bytes: number
}> {
  return uploadToCloudinary(file, folder, "video")
}

/**
 * Delete resource from Cloudinary
 * @param publicId Public ID of the resource
 * @param resourceType 'image' | 'video' | 'raw'
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  // This requires server-side implementation with API secret
  // Call your backend API endpoint that handles Cloudinary deletion
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId, resourceType }),
  })

  if (!response.ok) {
    throw new Error(`Cloudinary delete failed: ${response.statusText}`)
  }
}

/**
 * Generate Cloudinary transformation URL
 * @param publicId Public ID of the resource
 * @param transformations Transformation parameters
 * @returns Transformed URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb'
    quality?: 'auto' | number
    format?: 'jpg' | 'png' | 'webp' | 'auto'
    gravity?: 'auto' | 'face' | 'center'
  }
): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  
  if (!transformations) {
    return `${baseUrl}/${publicId}`
  }

  const params: string[] = []
  
  if (transformations.width) params.push(`w_${transformations.width}`)
  if (transformations.height) params.push(`h_${transformations.height}`)
  if (transformations.crop) params.push(`c_${transformations.crop}`)
  if (transformations.quality) params.push(`q_${transformations.quality}`)
  if (transformations.format) params.push(`f_${transformations.format}`)
  if (transformations.gravity) params.push(`g_${transformations.gravity}`)

  const transformString = params.join(',')
  return `${baseUrl}/${transformString}/${publicId}`
}

/**
 * Get video thumbnail from Cloudinary
 * @param publicId Public ID of the video
 * @param options Thumbnail options
 * @returns Thumbnail URL
 */
export function getVideoThumbnail(
  publicId: string,
  options?: {
    width?: number
    height?: number
    startOffset?: number // seconds
  }
): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`
  const params: string[] = []
  
  if (options?.width) params.push(`w_${options.width}`)
  if (options?.height) params.push(`h_${options.height}`)
  if (options?.startOffset) params.push(`so_${options.startOffset}`)
  
  params.push('f_jpg') // Convert to JPG thumbnail
  
  const transformString = params.join(',')
  return `${baseUrl}/${transformString}/${publicId}.jpg`
}

/**
 * Upload widget configuration for client-side uploads
 */
export function createUploadWidget(
  onSuccess: (result: any) => void,
  onError?: (error: any) => void,
  options?: {
    folder?: string
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
    maxFileSize?: number
    multiple?: boolean
  }
) {
  // @ts-ignore - Cloudinary widget is loaded via script tag
  if (typeof window !== 'undefined' && window.cloudinary) {
    // @ts-ignore
    return window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        folder: options?.folder || 'course-materials',
        resourceType: options?.resourceType || 'auto',
        maxFileSize: options?.maxFileSize || 10000000, // 10MB default
        multiple: options?.multiple || false,
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#4F46E5',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#4F46E5',
            action: '#FF620C',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#0078FF',
            complete: '#20B832',
            sourceBg: '#E4EBF1',
          },
        },
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          onError?.(error)
          return
        }
        
        if (result.event === 'success') {
          onSuccess(result.info)
        }
      }
    )
  }
  
  console.warn('Cloudinary widget not loaded. Include the script: https://widget.cloudinary.com/v2.0/global/all.js')
  return null
}
