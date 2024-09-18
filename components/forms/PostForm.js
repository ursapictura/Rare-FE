import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { createPost, updatePost } from '../../api/postData';
import getAllCategories from '../../api/categoryData';
import { useAuth } from '../../utils/context/authContext';
import { getAllTags, createTag } from '../../api/tagData';
import { addPostTag, removePostTag } from '../../api/postTagData';

const nullPost = {
  title: '',
  content: '',
  imageURL: '',
  categoryId: 0,
};

export default function PostForm({ postObj }) {
  const [formData, setFormData] = useState(nullPost);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const router = useRouter();
  const { user } = useAuth();

  const getCategories = () => {
    getAllCategories().then(setCategories);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleTagChange = (selections) => {
    setSelectedTags(selections);
  };

  const managePostTags = async (postId) => {
    selectedTags.forEach((tag) => {
      // Create tag if returned by the label instead of the tag Id, then addTag
      // Add tag to post if not yet attached to post
      if (typeof tag.value === 'string') {
        createTag({ label: tag.label }).then(({ id }) => addPostTag(postId, id));
      } else if (!postObj?.tags?.some((postTag) => postTag.id === tag.value)) {
        addPostTag(postId, tag.value);
      }
    });
    postObj?.tags?.forEach((tag) => {
      // Remove tag from post if tag no longer in list of selected tags
      if (!selectedTags.some((sTag) => sTag.value === tag.id)) {
        removePostTag(postId, tag.id);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (postObj?.id) {
      managePostTags(postObj.id);
      updatePost(postObj.id, { ...formData, authorId: user.id }).then(() => {
        router.push(`/posts/${postObj.id}`);
      });
    } else {
      createPost({
        ...formData,
        authorId: user.id,
      }).then(({ id }) => {
        managePostTags(id).then(() => router.push(`/posts/${id}`));
      });
    }
  };

  useEffect(() => {
    getCategories();
    getAllTags().then(setTags);
    if (postObj?.id) {
      setFormData({ ...postObj, categoryId: postObj.category.id });
      setSelectedTags(postObj.tags.map((tag) => ({ value: tag.id, label: tag.label })));
    }
  }, [postObj]);

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label> Title of Post</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter a title..."
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group>
        <Form.Label> Article Content</Form.Label>
        <Form.Control
          as="textarea"
          placeholder="What do you have to share..."
          name="content"
          style={{ height: '140px' }}
          value={formData.content}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group>
        <Form.Label> Image URL</Form.Label>
        <Form.Control
          type="text"
          placeholder="Image"
          name="imageURL"
          value={formData.imageURL}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label label="Category">
          <Form.Select
            aria-label="Category"
            name="categoryId"
            onChange={handleChange}
            className="mb-3"
            value={formData.categoryId}
            required
          >
            <option value="">Select a Category</option>
            {
            categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.label}
              </option>
            ))
          }
          </Form.Select>
        </Form.Label>
      </Form.Group>

      <CreatableSelect
        instanceId="tagSelect"
        aria-label="Tags"
        name="tags"
        className="mb-3"
        value={selectedTags}
        isMulti
        onChange={handleTagChange}
        options={tags.map((tag) => ({ value: tag.id, label: tag.label }))}
      />

      <Button variant="primary" type="submit"> {postObj.id ? 'Update Post' : 'Create Post'}
      </Button>
    </Form>
  );
}

PostForm.propTypes = {
  postObj: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    content: PropTypes.string,
    imageURL: PropTypes.string,
    authorId: PropTypes.string,
    category: PropTypes.shape({
      id: PropTypes.number,
    }),
    tags: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      label: PropTypes.string,
    })),
  }),
};

PostForm.defaultProps = {
  postObj: nullPost,
};
