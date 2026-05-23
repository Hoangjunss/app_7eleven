package com._eleven.shop.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;

    /**
     * Uploads a file to Cloudinary and returns the secure URL.
     *
     * @param file   the file to upload
     * @param folder the folder name in Cloudinary
     * @return the secure URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }
        try {
            Map<?, ?> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto"
            );
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new IllegalArgumentException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a file from Cloudinary using its public ID.
     *
     * @param publicId the public ID of the resource to delete
     */
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Failed to delete file from Cloudinary with publicId: {}", publicId, e);
        }
    }
}
